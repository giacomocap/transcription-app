import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { MenuIcon } from 'lucide-react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from './ui/drawer';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const Navigation = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const UserAvatar = ({ size = 'h-8 w-8' }) => (
        user?.user_metadata?.avatar_url ? (
            <img
                src={user.user_metadata?.avatar_url}
                alt={user.user_metadata?.full_name}
                className={`${size} rounded-full`}
            />
        ) : (
            <div className={`${size} rounded-full bg-primary text-primary-foreground flex items-center justify-center`}>
                {user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
        )
    );

    const ProfileMenu = ({ className = '', onClick = () => { } }: { className?: string, onClick?: () => void }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`p-0 h-auto justify-start ${className}`}>
                    <div className="flex items-center space-x-2">
                        <UserAvatar />
                        <span className="text-sm text-gray-700">
                            {user?.user_metadata?.full_name}
                        </span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link to="/settings" onClick={onClick}>Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                    Logout
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="text-xl font-bold text-gray-800">
                                Claire.AI
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {isAuthenticated && (
                                <>
                                    <Link
                                        to="/upload"
                                        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                    >
                                        Upload
                                    </Link>
                                    <Link
                                        to="/jobs"
                                        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                    >
                                        Transcriptions
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="hidden sm:flex items-center space-x-4">
                            {isAuthenticated ? (
                                <ProfileMenu />
                            ) : (
                                <Button asChild>
                                    <Link to="/login">Login</Link>
                                </Button>
                            )}
                        </div>
                        {isAuthenticated && (
                            <div className="sm:hidden flex items-center space-x-4">
                                <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                                    <DrawerTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <MenuIcon className="h-6 w-6" />
                                        </Button>
                                    </DrawerTrigger>
                                    <DrawerContent>
                                        <DrawerHeader>
                                            <DrawerTitle>Claire</DrawerTitle>
                                        </DrawerHeader>
                                        <div className="flex flex-col space-y-4 p-4">
                                            <Link
                                                to="/upload"
                                                className="hover:underline"
                                                onClick={() => setIsDrawerOpen(false)}
                                            >
                                                Upload
                                            </Link>
                                            <Link
                                                to="/jobs"
                                                className="hover:underline"
                                                onClick={() => setIsDrawerOpen(false)}
                                            >
                                                Transcriptions
                                            </Link>
                                            <ProfileMenu className="w-full" onClick={() => setIsDrawerOpen(false)} />
                                        </div>
                                    </DrawerContent>
                                </Drawer>
                            </div>
                        )}
                        {!isAuthenticated && (
                            <div className="sm:hidden">
                                <Button asChild>
                                    <Link to="/login">Login</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
