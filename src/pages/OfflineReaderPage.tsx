import { Navigate, useParams } from "react-router-dom";

// OfflineReaderPage now redirects to the regular ReaderPage
// which handles offline mode automatically via useSummary fallback
const OfflineReaderPage = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/book/${id}/read`} replace />;
};

export default OfflineReaderPage;
