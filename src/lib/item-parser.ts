// ============================================================================
// TYPES
// ============================================================================

export type ItemAction = 
  | { type: 'link'; url: string; display: string }
  | { type: 'list-nav'; listName: string; display: string }
  | { type: 'email'; address: string; display: string; subject?: string }
  | { type: 'phone'; number: string; display: string }
  | { type: 'calendar'; action: string; display: string }
  | { type: 'text'; content: string };

export interface ParsedItem {
  original: string;
  action: ItemAction;
  emoji?: string;
}

export interface ParserRule {
  name: string;
  pattern: RegExp;
  priority: number;
  parse: (text: string, match: RegExpMatchArray) => ItemAction | null;
  validate?: (action: ItemAction) => boolean;
}

// ============================================================================
// VALIDATORS
// ============================================================================

class Validators {
  static url(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      // Only allow http and https protocols
      if (!/^https?:$/.test(url.protocol)) {
        return false;
      }
      // Block URLs with @ symbol in suspicious positions (phishing protection)
      const hostname = url.hostname.toLowerCase();
      if (urlString.includes('@') && urlString.indexOf('@') < urlString.indexOf(hostname)) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  static email(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  static phone(phone: string): boolean {
    // Basic validation: at least 10 digits
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10;
  }
}

// ============================================================================
// PARSER RULES
// ============================================================================

class ParserRules {
  // Markdown-style links: [Display Text](url)
  static markdownLink: ParserRule = {
    name: 'markdown-link',
    priority: 100,
    pattern: /^\[(.+?)\]\((.+?)\)$/,
    parse: (text, match) => {
      const [, display, url] = match;
      return { type: 'link', url, display };
    },
    validate: (action) => {
      if (action.type === 'link') {
        return Validators.url(action.url);
      }
      return false;
    }
  };

  // List navigation: → List Name or -> List Name
  static listNav: ParserRule = {
    name: 'list-nav',
    priority: 90,
    pattern: /^(?:→|->)\s*(.+)$/,
    parse: (text, match) => {
      const listName = match[1].trim();
      return { type: 'list-nav', listName, display: listName };
    }
  };

  // Email with optional subject: @email@domain.com?subject=Hello
  static email: ParserRule = {
    name: 'email',
    priority: 80,
    pattern: /^@?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:\?subject=(.+))?$/,
    parse: (text, match) => {
      const address = match[1];
      const subject = match[2] ? decodeURIComponent(match[2]) : undefined;
      return { type: 'email', address, display: address, subject };
    },
    validate: (action) => {
      if (action.type === 'email') {
        return Validators.email(action.address);
      }
      return false;
    }
  };

  // Phone number: tel:+1234567890 or phone:123-456-7890
  static phone: ParserRule = {
    name: 'phone',
    priority: 70,
    pattern: /^(?:tel:|phone:|call:)?\s*(\+?[\d\s\-\(\)]{10,})$/i,
    parse: (text, match) => {
      const number = match[1].trim();
      return { type: 'phone', number, display: number };
    },
    validate: (action) => {
      if (action.type === 'phone') {
        return Validators.phone(action.number);
      }
      return false;
    }
  };

  // Calendar actions: cal:action or calendar:action
  static calendar: ParserRule = {
    name: 'calendar',
    priority: 60,
    pattern: /^(?:cal|calendar):(.+)$/i,
    parse: (text, match) => {
      const action = match[1].trim();
      return { type: 'calendar', action, display: action };
    }
  };

  // Plain URL (without markdown syntax)
  static plainUrl: ParserRule = {
    name: 'plain-url',
    priority: 50,
    pattern: /^(https?:\/\/.+)$/,
    parse: (text, match) => {
      const url = match[1];
      return { type: 'link', url, display: url };
    },
    validate: (action) => {
      if (action.type === 'link') {
        return Validators.url(action.url);
      }
      return false;
    }
  };

  static getAllRules(): ParserRule[] {
    return [
      this.markdownLink,
      this.listNav,
      this.email,
      this.phone,
      this.calendar,
      this.plainUrl
    ].sort((a, b) => b.priority - a.priority);
  }
}

// ============================================================================
// EMOJI EXTRACTOR
// ============================================================================

class EmojiExtractor {
  private static readonly EMOJI_REGEX = /^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])\s+/u;

  static extract(text: string): { emoji?: string; textWithoutEmoji: string } {
    const match = text.match(this.EMOJI_REGEX);
    if (match) {
      return {
        emoji: match[1],
        textWithoutEmoji: text.slice(match[0].length).trim()
      };
    }
    return { textWithoutEmoji: text };
  }
}

// ============================================================================
// PARSER ENGINE
// ============================================================================

export class ItemParser {
  private rules: ParserRule[];

  constructor(customRules: ParserRule[] = []) {
    // Combine default rules with custom rules and sort by priority
    this.rules = [...ParserRules.getAllRules(), ...customRules]
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Add a custom parser rule
   */
  addRule(rule: ParserRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove a parser rule by name
   */
  removeRule(name: string): void {
    this.rules = this.rules.filter(rule => rule.name !== name);
  }

  /**
   * Parse item text and extract actionable patterns
   */
  parse(text: string): ParsedItem {
    const trimmed = text.trim();
    
    // Extract emoji
    const { emoji, textWithoutEmoji } = EmojiExtractor.extract(trimmed);

    // Try each rule in priority order
    for (const rule of this.rules) {
      const match = textWithoutEmoji.match(rule.pattern);
      if (match) {
        const action = rule.parse(textWithoutEmoji, match);
        if (action) {
          // Validate if validator exists
          if (rule.validate && !rule.validate(action)) {
            continue;
          }
          return { original: text, action, emoji };
        }
      }
    }

    // Default: plain text
    return {
      original: text,
      action: { type: 'text', content: textWithoutEmoji },
      emoji
    };
  }

  /**
   * Get all registered rule names
   */
  getRuleNames(): string[] {
    return this.rules.map(rule => rule.name);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export class ItemUtils {
  /**
   * Get display text for an item
   */
  static getDisplayText(parsed: ParsedItem): string {
    const prefix = parsed.emoji ? `${parsed.emoji} ` : '';
    
    switch (parsed.action.type) {
      case 'link':
        return prefix + parsed.action.display;
      case 'list-nav':
        return prefix + `→ ${parsed.action.display}`;
      case 'email':
        return prefix + parsed.action.display;
      case 'phone':
        return prefix + parsed.action.display;
      case 'calendar':
        return prefix + parsed.action.display;
      case 'text':
        return prefix + parsed.action.content;
    }
  }

  /**
   * Check if item has an executable action
   */
  static hasAction(parsed: ParsedItem): boolean {
    return parsed.action.type !== 'text';
  }

  /**
   * Get icon name for action type (for use with lucide-react)
   */
  static getActionIcon(actionType: ItemAction['type']): string {
    switch (actionType) {
      case 'link': return 'ExternalLink';
      case 'list-nav': return 'ArrowRight';
      case 'email': return 'Mail';
      case 'phone': return 'Phone';
      case 'calendar': return 'Calendar';
      case 'text': return '';
    }
  }

  /**
   * Get action handler URL/href for different action types
   */
  static getActionHref(action: ItemAction): string | null {
    switch (action.type) {
      case 'link':
        return action.url;
      case 'email':
        const subject = action.subject ? `?subject=${encodeURIComponent(action.subject)}` : '';
        return `mailto:${action.address}${subject}`;
      case 'phone':
        return `tel:${action.number.replace(/\D/g, '')}`;
      case 'list-nav':
      case 'calendar':
      case 'text':
        return null; // These need custom handlers
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Create default parser instance
export const defaultParser = new ItemParser();

// Convenience function using default parser
export function parseItemText(text: string): ParsedItem {
  return defaultParser.parse(text);
}