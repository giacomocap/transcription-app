import { Link } from 'react-router-dom';
import { Upload, FileText, Settings } from 'lucide-react';

export const Navigation = () => (
    <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
                <div className="flex space-x-8">
                    <Link
                        to="/upload"
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                    </Link>
                    <Link
                        to="/jobs"
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Jobs
                    </Link>
                    <Link
                        to="/admin"
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        Admin
                    </Link>
                </div>
            </div>
        </div>
    </nav>
);