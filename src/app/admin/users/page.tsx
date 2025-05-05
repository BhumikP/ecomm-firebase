'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserCog, Trash2, UserX, UserCheck, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuPortal, // Ensure Portal is imported
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import type { IUser } from '@/models/User'; // Import User model type

// Define User Type matching the backend model, including _id
type UserData = Omit<IUser, 'passwordHash'> & { _id: string };


export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Store ID of user being deleted
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // Store ID of user being updated
  const { toast } = useToast();

  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || 'Failed to fetch users');
      }
      const data = await response.json();
        // Ensure data.users is an array
      if (data && Array.isArray(data.users)) {
           setUsers(data.users);
      } else {
           console.error("Invalid user data received:", data);
           setUsers([]); // Set to empty array if data is invalid
           throw new Error("Received invalid user data format.");
      }

    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || "Could not load users.");
      toast({ variant: "destructive", title: "Error", description: err.message || "Could not load users." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

   // Handle User Deletion
   const handleDeleteUser = async (userId: string, userName: string) => {
        setIsDeleting(userId);
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete user');
            }

            setUsers(prev => prev.filter(u => u._id !== userId));
            toast({ title: "User Deleted", description: `User "${userName}" has been removed.` });

        } catch (error: any) {
            console.error("Error deleting user:", error);
            toast({ variant: "destructive", title: "Error", description: error.message || "Could not delete user." });
        } finally {
            setIsDeleting(null);
        }
    };

     // Handle User Update (Status or Role)
    const handleUpdateUser = async (userId: string, updateData: Partial<Pick<UserData, 'role' | 'status'>>) => {
        setIsUpdating(userId);
        const action = updateData.role ? 'role' : 'status';
        const value = updateData.role || updateData.status;
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to update user ${action}`);
            }

            const result = await response.json();
            // Ensure result.user contains the updated fields
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, ...result.user } : u));
             toast({ title: "User Updated", description: `User's ${action} changed to ${value}.` });

        } catch (error: any) {
            console.error(`Error updating user ${action}:`, error);
            toast({ variant: "destructive", title: "Update Error", description: error.message || `Could not update user ${action}.` });
        } finally {
            setIsUpdating(null);
        }
    };


  // Determine Badge variant based on status
  const getStatusBadgeVariant = (status: UserData['status']) => {
    return status === 'Active' ? 'default' : 'destructive';
  };
   const getStatusBadgeColor = (status: UserData['status']) => {
     return status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200';
   };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Manage Users</h2>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>View and manage registered users.</CardDescription>
          {/* Add filtering/search input here later */}
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                     {[...Array(5)].map((_, i) => ( // Skeleton Rows
                        <TableRow key={`skel-${i}`}>
                            <TableCell><Skeleton className="h-5 w-24 bg-muted" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32 bg-muted" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-12 bg-muted" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20 bg-muted" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16 bg-muted rounded-full" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto bg-muted rounded" /></TableCell>
                        </TableRow>
                     ))}
                 </TableBody>
             </Table>
          ) : error ? (
              <p className="text-center py-10 text-destructive">{error}</p>
          ) : users.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id} className={`${isDeleting === user._id || isUpdating === user._id ? 'opacity-50 pointer-events-none' : ''}`}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.joinedDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(user.status)} className={getStatusBadgeColor(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       {(isDeleting === user._id || isUpdating === user._id) ? (
                           <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                       ) : (
                           <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                               <Button variant="ghost" className="h-8 w-8 p-0">
                               <span className="sr-only">Open menu for {user.name}</span>
                               <MoreHorizontal className="h-4 w-4" />
                               </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                               <DropdownMenuLabel>Actions</DropdownMenuLabel>
                               <DropdownMenuSeparator />

                                {/* Change Role Submenu */}
                                <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <UserCog className="mr-2 h-4 w-4" />
                                    <span>Change Role</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup
                                        value={user.role}
                                        onValueChange={(value) => handleUpdateUser(user._id, { role: value as 'user' | 'admin' })}
                                        >
                                        <DropdownMenuRadioItem value="user" disabled={user.role === 'user'}>User</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="admin" disabled={user.role === 'admin'}>Admin</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                                </DropdownMenuSub>

                                {/* Change Status Actions */}
                                {user.status === 'Active' ? (
                                    <DropdownMenuItem onClick={() => handleUpdateUser(user._id, { status: 'Inactive' })}>
                                        <UserX className="mr-2 h-4 w-4" />
                                        Deactivate User
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => handleUpdateUser(user._id, { status: 'Active' })}>
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Activate User
                                    </DropdownMenuItem>
                                )}

                               <DropdownMenuSeparator />

                                {/* Delete User Action */}
                               <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                         <DropdownMenuItem
                                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                onSelect={(e) => e.preventDefault()} // Prevent closing dropdown
                                                disabled={isDeleting === user._id}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete User
                                         </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the user
                                            "{user.name}" and potentially their associated data.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isDeleting === user._id}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDeleteUser(user._id, user.name)}
                                            className="bg-destructive hover:bg-destructive/90"
                                            disabled={isDeleting === user._id}
                                        >
                                            {isDeleting === user._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Delete
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                           </DropdownMenuContent>
                           </DropdownMenu>
                       )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
       {/* TODO: Add pagination controls here later */}
    </div>
  );
}
