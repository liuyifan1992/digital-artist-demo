import { Page } from "@vercel/examples-ui";
interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <section className="flex flex-row gap-6 justify-center">
      {/* <header className="container sticky top-0 z-40 bg-white">
        <div className="h-16 border-b border-b-slate-200 py-4">
          <nav className="ml-4 pl-6">
            <a href="#" className="hover:text-slate-600 cursor-pointer">
              Home
            </a>
          </nav>
        </div>
      </header> */}
      <Page className="flex flex-col gap-3">
        <section className="flex w-full flex-1 flex-col overflow-hidden">
          {children}
        </section>
      </Page>
    </section>
  );
}
