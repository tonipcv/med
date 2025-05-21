'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FormBlock {
  id: string;
  type: string;
  content: any;
  order: number;
}

interface Form {
  id: string;
  title: string;
  blocks: FormBlock[];
}

interface FormEditorProps {
  form: Form;
}

export function FormEditor({ form }: FormEditorProps) {
  const [title, setTitle] = useState(form.title);
  const [blocks, setBlocks] = useState(form.blocks);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/forms/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          blocks,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save form');
      }

      // Show success message or redirect
    } catch (error) {
      console.error('Error saving form:', error);
      // Show error message
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Form Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="space-y-4">
              {blocks.map((block, index) => (
                <Card key={block.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Block Type: {block.type}</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newBlocks = [...blocks];
                            if (index > 0) {
                              [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
                              setBlocks(newBlocks);
                            }
                          }}
                          disabled={index === 0}
                        >
                          Move Up
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newBlocks = [...blocks];
                            if (index < blocks.length - 1) {
                              [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
                              setBlocks(newBlocks);
                            }
                          }}
                          disabled={index === blocks.length - 1}
                        >
                          Move Down
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const newBlocks = blocks.filter((_, i) => i !== index);
                            setBlocks(newBlocks);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button onClick={handleSave} className="w-full">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 