import { useParams, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useSummary } from "@/hooks/useSummary";
import { useBook } from "@/hooks/useBooks";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

const ReaderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: book } = useBook(id!);
  const { data: summary, isLoading } = useSummary(id!);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!summary?.content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <p className="text-muted-foreground">Саммари пока не добавлено</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Назад</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="tap-highlight">
          <X className="h-5 w-5 text-foreground" />
        </button>
        <span className="max-w-[60%] truncate text-sm font-semibold text-foreground">
          {book?.title}
        </span>
        <div className="w-5" />
      </div>

      {/* Markdown content */}
      <article className="prose prose-sm max-w-none px-5 py-6 text-foreground
        prose-headings:font-bold prose-headings:text-foreground
        prose-h1:text-xl prose-h1:mb-4 prose-h1:mt-6
        prose-h2:text-lg prose-h2:mb-3 prose-h2:mt-5
        prose-h3:text-base prose-h3:mb-2 prose-h3:mt-4
        prose-p:text-sm prose-p:leading-relaxed prose-p:text-muted-foreground prose-p:font-serif
        prose-li:text-sm prose-li:text-muted-foreground prose-li:font-serif
        prose-strong:text-foreground prose-strong:font-semibold
        prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:italic
        prose-code:text-xs prose-code:bg-secondary prose-code:rounded prose-code:px-1.5 prose-code:py-0.5
        prose-hr:border-border
      ">
        <ReactMarkdown>{summary.content}</ReactMarkdown>
      </article>
    </div>
  );
};

export default ReaderPage;
