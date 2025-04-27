'use client';

import React, {useState} from 'react';
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {signIn, signOut, useSession} from 'next-auth/react';

export default function Home() {
  const [open, setOpen] = React.useState(false);
  const [gitRepoUrl, setGitRepoUrl] = useState('');
  const {data: session} = useSession();

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
        <MainContent
          session={session}
          open={open}
          setOpen={setOpen}
          gitRepoUrl={gitRepoUrl}
          setGitRepoUrl={setGitRepoUrl}
        />
      </div>
    </SidebarProvider>
  );
}

function MainContent({session, open, setOpen, gitRepoUrl, setGitRepoUrl}) {
  return (
    <div className="flex-1 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        {!session ? (
          <Button onClick={() => signIn('github')}>Sign In</Button>
        ) : (
          <>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Document
            </Button>
            <Button onClick={() => signOut()}>Sign Out</Button>
          </>
        )}
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Edit Profile</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
            <DialogDescription>
              Input a valid Github URL to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="giturl">Github URL</Label>
              <Input
                type="text"
                id="giturl"
                value={gitRepoUrl}
                onChange={e => setGitRepoUrl(e.target.value)}
              />
            </div>
          </div>
          {/* <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter> */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
