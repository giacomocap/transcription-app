import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { MenuIcon } from 'lucide-react';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from './ui/drawer';

export const Navigation = () => {
    const { user, isAuthenticated, logout, login } = useAuth();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
                                    {/* <Link
                                        to="/admin"
                                        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                    >
                                        Admin
                                    </Link> */}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="hidden sm:flex items-center space-x-4">
                            {isAuthenticated ? (
                                <div className="flex items-center space-x-2">
                                    {user?.profile_picture && (
                                        <img
                                            src={user.profile_picture}
                                            alt={user.display_name}
                                            className="h-8 w-8 rounded-full"
                                        />
                                    )}
                                    <span className="text-sm text-gray-700">{user?.display_name}</span>
                                    <Button onClick={logout} variant="outline" size="sm">
                                        Logout
                                    </Button>
                                </div>
                            ) : (
                                <Button onClick={login}>Login</Button>
                            )}
                        </div>
                        {isAuthenticated && (
                            <div className="sm:hidden">
                                <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                                    <DrawerTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <MenuIcon className="h-6 w-6" />
                                        </Button>
                                    </DrawerTrigger>
                                    <DrawerContent>
                                        <DrawerHeader>
                                            <DrawerTitle>Menu</DrawerTitle>
                                            <DrawerDescription>
                                                Access the main features
                                            </DrawerDescription>
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
                                            <Button onClick={() => {
                                                logout();
                                                setIsDrawerOpen(false);
                                            }} variant="outline" size="sm">
                                                Logout
                                            </Button>
                                        </div>
                                    </DrawerContent>
                                </Drawer>
                            </div>
                        )}
                        {!isAuthenticated && (
                            <div className="sm:hidden">
                                <Button onClick={login}>Login</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
