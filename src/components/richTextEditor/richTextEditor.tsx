'use client';

import Quill from 'quill';
import 'quill/dist/quill.snow.css'; // Import Quill styles
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// Define the ref type for the RichTextEditor component
export type RichTextEditorHandle = {
  getContent: () => string;
};

interface RichTextEditorProps {
  initialContent?: string;
  headerText?: string;
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(({ initialContent, headerText }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      // Remove any existing toolbar before initializing Quill
      const existingToolbars = editorRef.current.parentElement?.querySelectorAll('.ql-toolbar');
      existingToolbars?.forEach(tb => tb.remove());
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean'],
          ],
        },
        placeholder: 'Write something...',
      });
      if (initialContent) {
        quillRef.current.root.innerHTML = initialContent;
      }
    }
    return () => {
      quillRef.current = null; // Cleanup to avoid memory leaks
    };
  }, []);

  // Update content if initialContent changes (for edit mode)
  useEffect(() => {
    if (quillRef.current && typeof initialContent === 'string') {
      quillRef.current.root.innerHTML = initialContent;
    }
  }, [initialContent]);

  // Expose the getContent function to the parent component
  useImperativeHandle(ref, () => ({
    getContent: () => {
      if (quillRef.current) {
        return quillRef.current.root.innerHTML; // Return the HTML content
      }
      return '';
    },
  }));

  return (
    <div>
      {headerText && <div className="mb-2 font-semibold text-base">{headerText}</div>}
      <div ref={editorRef} style={{ height: '300px' }} />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';
export default RichTextEditor;