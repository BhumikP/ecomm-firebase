'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react"; // Example icon for actions
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock User Data
const users = [
  { id: 'usr_1', name: 'Alice Smith', email: 'alice@example.com', role: 'user', joined: '2023-10-15', status: 'Active' },
  { id: 'usr_2', name: 'Bob Johnson', email: 'bob@example.com', role: 'user', joined: '2023-11-01', status: 'Active' },
  { id: 'usr_3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'user', joined: '2024-01-20', status: 'Inactive' },
  { id: 'adm_1', name: 'Admin User', email: 'admin@example.com', role: 'admin', joined: '2023-01-01', status: 'Active' },
];

export default function AdminUsersPage() {

  // TODO: Add state for users, filtering, pagination, etc.
  // TODO: Implement actions like edit role, deactivate/activate, delete user

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
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.joined).toLocaleDateString()}</TableCell>
                  <TableCell>
                     <Badge variant={user.status === 'Active' ? 'default' : 'outline'} className={user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                       {user.status}
                     </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => console.log('View user', user.id)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log('Edit user', user.id)}>
                          Edit User
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => console.log('Change role', user.id)}>
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                         <DropdownMenuItem
                           className="text-destructive focus:text-destructive focus:bg-destructive/10"
                           onClick={() => console.log('Delete user', user.id)}
                         >
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
       {/* Add pagination controls here later */}
    </div>
  );
}
