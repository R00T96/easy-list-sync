import React, { useState } from 'react';
import { ShoppingCart, Plus, Check, Heart, Diamond, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';

interface ShoppingItem {
  id: string;
  name: string;
  completed: boolean;
}

// Separate component that uses useSidebar
const MyListContent: React.FC = () => {
  const [items, setItems] = useState<ShoppingItem[]>([
    { id: '1', name: 'Pizza dough flour', completed: false },
    { id: '2', name: 'Active dry yeast', completed: false },
    { id: '3', name: 'Olive oil', completed: false },
    { id: '4', name: 'Salt', completed: true },
    { id: '5', name: 'Tomato sauce', completed: false },
    { id: '6', name: 'Mozzarella cheese', completed: false },
    { id: '7', name: 'Fresh basil', completed: false },
    { id: '8', name: 'Pepperoni', completed: false },
  ]);
  const [newItem, setNewItem] = useState('');
  const { toggleSidebar } = useSidebar(); // Now this is inside SidebarProvider

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const addItem = () => {
    if (newItem.trim()) {
      setItems([...items, {
        id: Date.now().toString(),
        name: newItem.trim(),
        completed: false
      }]);
      setNewItem('');
    }
  };

  return (
    <div className="flex-1">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              type="button" 
              aria-label="Toggle sidebar" 
              onClick={toggleSidebar} 
              className="p-0 h-auto bg-transparent hover:bg-transparent border-0 shadow-none"
            >
              <ShoppingCart className="w-6 h-6 text-primary hover-scale cursor-pointer transition-all duration-200 hover:text-primary-glow" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Home Made Pizza</h1>
          </div>
          
          {/* Composite User Profile Icon */}
          <div className="relative">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20">
              <div className="w-6 h-6 bg-primary/30 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary">U</span>
              </div>
            </div>
            {/* Online status indicator */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background"></div>
          </div>
        </div>
      </header>

      {/* My List Content */}
      <div className="p-4 space-y-4">
        {/* Add new item */}
        <Card className="p-4 bg-card/50 border-border">
          <div className="flex space-x-2">
            <Input
              placeholder="Add item..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              className="flex-1"
            />
            <Button 
              onClick={addItem}
              size="icon"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* My Items */}
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className="p-3 bg-card/30 border-border">
              <div 
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => toggleItem(item.id)}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  item.completed 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'border-muted-foreground'
                }`}>
                  {item.completed && <Check className="w-3 h-3" />}
                </div>
                <span className={`flex-1 ${
                  item.completed 
                    ? 'text-muted-foreground line-through' 
                    : 'text-foreground'
                }`}>
                  {item.name}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* Progress indicator */}
        <Card className="p-4 bg-gradient-subtle border-border">
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              {items.filter(item => item.completed).length} of {items.length} items
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(items.filter(item => item.completed).length / items.length) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const MyList: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="min-h-screen bg-background w-full flex">
        {/* Sidebar */}
        <Sidebar>
          <SidebarContent>
            {/* New List */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="text-primary">
                      <Plus className="w-4 h-4" />
                      <span>New List</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Public Lists */}
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center space-x-2">
                <Heart className="w-4 h-4" />
                <span>Public Lists</span>
              </SidebarGroupLabel>
            </SidebarGroup>

            {/* My Lists */}
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center space-x-2">
                <Diamond className="w-4 h-4" />
                <span>My Lists</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <span>1. Waterfall visit</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="bg-muted text-primary">
                      <span>2. Pizza night</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <span>3. Tea party</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <span>4. Chores</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Other Features */}
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center space-x-2">
                <MoreHorizontal className="w-4 h-4" />
                <span>Other Features</span>
              </SidebarGroupLabel>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <MyListContent />
      </div>
    </SidebarProvider>
  );
};

export default MyList;