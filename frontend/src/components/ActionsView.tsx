import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Job, ActionItem } from "../types";

interface ActionsViewProps {
    job: Job;
}

export const ActionsView = ({ job }: ActionsViewProps) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAction, setNewAction] = useState({
        description: "",
        priority: "medium",
        status: "pending"
    });

    const handleAddAction = async () => {
        // Implement add action logic here
    };

    const handleStatusChange = async (actionId: string, status: ActionItem['status']) => {
        // Implement status change logic here
    };

    const getPriorityColor = (priority: ActionItem['priority']) => {
        switch (priority) {
            case 'high':
                return 'text-red-600 bg-red-50';
            case 'medium':
                return 'text-yellow-600 bg-yellow-50';
            case 'low':
                return 'text-green-600 bg-green-50';
        }
    };

    const getStatusColor = (status: ActionItem['status']) => {
        switch (status) {
            case 'completed':
                return 'text-green-600 bg-green-50';
            case 'in_progress':
                return 'text-blue-600 bg-blue-50';
            case 'pending':
                return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Action Items</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Action
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {showAddForm && (
                        <div className="border rounded-lg p-4 space-y-4">
                            <Input
                                placeholder="Action description"
                                value={newAction.description}
                                onChange={(e) => setNewAction({
                                    ...newAction,
                                    description: e.target.value
                                })}
                            />
                            <div className="flex gap-4">
                                <Select
                                    value={newAction.priority}
                                    onValueChange={(value: ActionItem['priority']) => 
                                        setNewAction({ ...newAction, priority: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAddForm(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleAddAction}
                                >
                                    Add Action
                                </Button>
                            </div>
                        </div>
                    )}

                    {job.action_items && job.action_items.length > 0 ? (
                        job.action_items.map((action) => (
                            <div key={action.id} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="font-medium">{action.description}</p>
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(action.priority)}`}>
                                                {action.priority}
                                            </span>
                                            <Select
                                                value={action.status}
                                                onValueChange={(value: ActionItem['status']) => 
                                                    handleStatusChange(action.id, value)}
                                            >
                                                <SelectTrigger className={`h-6 text-xs ${getStatusColor(action.status)}`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {action.timestamp && (
                                        <span className="text-xs text-gray-500">
                                            {action.timestamp}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 italic">No action items added yet.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
