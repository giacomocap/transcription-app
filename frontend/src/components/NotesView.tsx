import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Job, Note } from "../types";

interface NotesViewProps {
    job: Job;
}

export const NotesView = ({ job }: NotesViewProps) => {
    const [newNote, setNewNote] = useState("");
    const [editingNote, setEditingNote] = useState<string | null>(null);

    const handleAddNote = async () => {
        // Implement add note logic here
    };

    const handleUpdateNote = async (noteId: string) => {
        // Implement update note logic here
    };

    const handleDeleteNote = async (noteId: string) => {
        // Implement delete note logic here
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Notes</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setEditingNote('new')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Note
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {editingNote === 'new' && (
                        <div className="space-y-2">
                            <Textarea
                                placeholder="Enter your note..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingNote(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleAddNote}
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    )}

                    {job.notes && job.notes.length > 0 ? (
                        job.notes.map((note) => (
                            <div key={note.id} className="border rounded-lg p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div className="text-sm text-gray-500">
                                        {new Date(note.timestamp).toLocaleString()}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingNote(note.id)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteNote(note.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                {editingNote === note.id ? (
                                    <div className="space-y-2">
                                        <Textarea
                                            defaultValue={note.content}
                                            className="min-h-[100px]"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setEditingNote(null)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpdateNote(note.id)}
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="whitespace-pre-wrap">{note.content}</div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 italic">No notes added yet.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
