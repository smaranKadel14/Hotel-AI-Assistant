"use client";

type DeleteKnowledgeBaseButtonProps = {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
};

export default function DeleteKnowledgeBaseButton({ id, action }: DeleteKnowledgeBaseButtonProps) {
  return (
    <form action={action} onSubmit={(event) => {
      if (!window.confirm("Delete this knowledge-base entry? This cannot be undone.")) {
        event.preventDefault();
      }
    }}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm font-semibold text-red-600 hover:text-red-700">Delete</button>
    </form>
  );
}
