import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Plus, Book, FileText, Lightbulb, Settings} from 'lucide-react';

export default function Home() {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar collapsible="icon">
          <SidebarHeader className="font-bold text-md">
            DocuMind
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Book className="mr-2 h-4 w-4" />
                  Documentation
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <FileText className="mr-2 h-4 w-4" />
                  Tasks
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Suggestions
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <MainContent />
      </div>
    </SidebarProvider>
  );
}

function MainContent() {
  return (
    <div className="flex-1 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Document
        </Button>
      </div>
      <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Documents</CardTitle>
            <CardDescription>Number of documents ingested</CardDescription>
          </CardHeader>
          <CardContent>120</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
            <CardDescription>Documentation tasks to be completed</CardDescription>
          </CardHeader>
          <CardContent>35</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI Suggestions</CardTitle>
            <CardDescription>Generated documentation improvements</CardDescription>
          </CardHeader>
          <CardContent>80</CardContent>
        </Card>
      </div>
    </div>
  );
}
