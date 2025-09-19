import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";

// Demo seed data
export const seedLists = [
    {
        category: "Student Research",
        items: [
            { text: "📚 Find journal articles on AI ethics" },
            { text: "📝 Summarize lecture notes" },
            { text: "📊 Collect data for statistics assignment" },
            { text: "🔍 Verify sources for essay" }
        ]
    },
    {
        category: "Wellbeing & Energy",
        items: [
            { text: "💧 Drink 2L water (remind your group!)" },
            { text: "🧘 10 min meditation together" },
            { text: "🎶 Play a focus playlist for all" },
            { text: "🌳 Walk outside for fresh air (sync break)" }
        ]
    },
    {
        category: "Money Watchlist",
        items: [
            { text: "💳 Check credit card statement (group review)" },
            { text: "📉 Track investment losses (share insights)" },
            { text: "⚠️ Review pending bills (remind each other)" },
            { text: "🛑 Avoid unnecessary purchases (accountability!)" }
        ]
    },
    {
        category: "Opportunities",
        items: [
            { text: "🚀 Apply for freelance gig (share progress)" },
            { text: "💡 Pitch new app feature (get feedback)" },
            { text: "🤝 Connect with mentor on LinkedIn (invite a friend)" },
            { text: "📈 Explore passive income idea (brainstorm together)" }
        ]
    },
    {
        category: "App Builder's Sandbox",
        items: [
            { text: "🛠 Prototype new feature (pair up!)" },
            { text: "📱 Test list sync on two devices" },
            { text: "🎨 Sketch UI improvements (collab mode)" },
            { text: "🧩 Brainstorm integrations (Notion, Slack...)" }
        ]
    },
    {
        category: "Weekly Planning",
        items: [
            { text: "🗓 Review calendar for week (sync with team)" },
            { text: "✅ Prioritize top 3 tasks per day (together)" },
            { text: "📤 Share checklist with team (real-time updates)" },
            { text: "📌 Reflect on wins & lessons (group share)" }
        ]
    },
    {
        category: "Weekend Plans",
        items: [
            { text: "🎬 Movie night with friends" },
            { text: "🏃‍♂️ Go for a morning run" },
            { text: "🍳 Try a new brunch recipe" },
            { text: "🎲 Board games or trivia with family" },
        ]
    }
];

type UseDemoSeedsProps = {
    pin: string | null;
    setText: (text: string) => void;
    addItem: () => void;
    onBatchAdd?: (items: string[]) => void; // Optional callback for batch adding
};

export const useDemoSeeds = ({ pin, setText, addItem, onBatchAdd }: UseDemoSeedsProps) => {

    const seedDemo = useCallback(async (category: string) => {
        if (!pin) {
            toast({ title: "Join List", description: "Please join a List to add demo items." });
            return;
        }

        const found = seedLists.find(l => l.category === category);
        if (!found) return;

        // If a batch add function is provided, use it (more efficient)
        if (onBatchAdd) {
            const itemTexts = found.items.map(item => item.text);
            onBatchAdd(itemTexts);
            toast({
                title: `✨ ${category} demo added!`,
                description: `Added ${itemTexts.length} items - everyone will see them instantly.`
            });
            return;
        }

        // Fallback: add items one by one using the existing addItem function
        toast({
            title: `✨ Adding ${category} demo...`,
            description: `Adding ${found.items.length} items one by one.`
        });

        for (const item of found.items) {
            setText(item.text);
            // Small delay to ensure each item is processed
            await new Promise(resolve => setTimeout(resolve, 50));
            addItem();
        }

        toast({
            title: `✅ ${category} demo complete!`,
            description: `Added ${found.items.length} items - everyone will see them.`
        });
    }, [pin, setText, addItem, onBatchAdd]);

    // Return available categories and the seed function
    return {
        seedDemo,
        availableCategories: seedLists.map(list => ({
            category: list.category,
            emoji: list.items[0]?.text.split(' ')[0] || '📋',
            count: list.items.length
        }))
    };
};