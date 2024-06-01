export const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto flex w-screen flex-1 flex-col items-center justify-between">
    <div className="mx-auto flex h-full w-full max-w-3xl flex-initial flex-col items-center justify-between px-4 py-6 sm:px-16 lg:px-24">
      {children}
    </div>
  </div>
);
