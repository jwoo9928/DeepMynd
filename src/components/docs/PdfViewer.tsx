import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  Worker,
  Viewer,
  SpecialZoomLevel,
  DocumentLoadEvent,
  PageChangeEvent,
} from "@react-pdf-viewer/core";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";

// Define page titles interface
interface PageInfo {
  pageNumber: number;
  title: string;
}

const PdfViewer: React.FC = () => {
  const pdfUrl = import.meta.env.VITE_APP_PDF_URL;
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const viewerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Page information
  const pageInfos: PageInfo[] = useMemo(
    () => [
      { pageNumber: 1, title: "포트폴리오" },
      { pageNumber: 2, title: "자기소개" },
      { pageNumber: 3, title: "프로젝트 목차" },
      { pageNumber: 4, title: "Sonobook" },
      { pageNumber: 5, title: "Introduce" },
      { pageNumber: 6, title: "Architecture" },
      { pageNumber: 7, title: "Troubleshooting" },
      { pageNumber: 8, title: "Biport & Pockie" },
      { pageNumber: 9, title: "Introduce" },
      { pageNumber: 10, title: "Architecture" },
      { pageNumber: 11, title: "Troubleshooting" },
      { pageNumber: 12, title: "Unimynd" },
      { pageNumber: 13, title: "Introduce" },
      { pageNumber: 14, title: "Architecture" },
      { pageNumber: 15, title: "Troubleshooting" },
    ],
    []
  );

  // Create the page navigation plugin instance
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { jumpToPage } = pageNavigationPluginInstance;

  // Function to handle document load
  const handleDocumentLoad = useCallback((e: DocumentLoadEvent) => {
    setNumPages(e.doc.numPages);
  }, []);

  // Function to handle page change
  const handlePageChange = useCallback((e: PageChangeEvent) => {
    setCurrentPage(e.currentPage + 1);

    // Scroll the sidebar to show the current page
    if (sidebarRef.current) {
      const activeButton = sidebarRef.current.querySelector(
        `.page-btn-${e.currentPage + 1}`
      );
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, []);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // Generate page buttons - memoized for performance
  const pageButtons = useMemo(() => {
    return pageInfos.map((page) => {
      const isActive = currentPage === page.pageNumber;

      return (
        <button
          key={`page_${page.pageNumber}`}
          className={`page-btn-${
            page.pageNumber
          } flex items-center w-full py-2 px-3 rounded-lg mb-1 transition-all duration-200 text-left
                    ${
                      isActive
                        ? "bg-blue-50 border-l-4 border-blue-600 text-blue-700 font-medium shadow-sm"
                        : "hover:bg-gray-100 text-gray-700 hover:border-l-2 hover:border-blue-300"
                    }`}
          onClick={() => jumpToPage(page.pageNumber - 1)}
          aria-label={`Go to page ${page.pageNumber}: ${page.title}`}
        >
          <div
            className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 text-xs font-bold
                        ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
          >
            {page.pageNumber}
          </div>
          <span className="truncate text-sm">{page.title}</span>
        </button>
      );
    });
  }, [currentPage, jumpToPage, pageInfos]);

  return (
    <div ref={viewerRef} className="flex h-screen w-full bg-gray-50">
      {/* Toggle sidebar button */}
      <button
        className="fixed top-4 left-4 z-20 bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition-colors"
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isSidebarOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        )}
      </button>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-full bg-white shadow-lg z-10 overflow-y-auto transition-all duration-300 ease-in-out
                   ${
                     isSidebarOpen
                       ? "translate-x-0 w-64"
                       : "-translate-x-full w-0"
                   }`}
      >
        <div className="sticky top-0 bg-white z-10 px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">목차</h3>
          <div className="flex items-center mt-1">
            <span className="text-sm text-gray-500">현재 페이지: </span>
            <div className="ml-2 px-2 py-1 bg-blue-100 rounded-md text-sm font-medium text-blue-800">
              {currentPage} / {numPages}
            </div>
          </div>
        </div>

        <div className="px-3 py-4">{pageButtons}</div>
      </div>

      {/* Main content */}
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Worker workerUrl="/workers/pdf.worker.min.mjs">
          <div className="h-full relative overflow-hidden">
            <Viewer
              fileUrl={pdfUrl}
              defaultScale={SpecialZoomLevel.PageFit}
              plugins={[pageNavigationPluginInstance]}
              onDocumentLoad={handleDocumentLoad}
              onPageChange={handlePageChange}
            />
          </div>
        </Worker>
      </div>
    </div>
  );
};

export default PdfViewer;

//<Worker workerUrl="/workers/pdf.worker.min.mjs">
