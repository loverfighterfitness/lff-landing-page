import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

// Everything except the homepage is split out so coaching visitors
// don't download the shop, admin dashboards or chart libraries.
const Admin = lazy(() => import("./pages/Admin"));
const Calculator = lazy(() => import("./pages/Calculator"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const Success = lazy(() => import("./pages/Success"));
const Referral = lazy(() => import("./pages/Referral"));
const Shop = lazy(() => import("./pages/Shop"));
const Program = lazy(() => import("./pages/Program"));

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: "#54412F" }} />}>
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/calculator"} component={Calculator} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/admin/leads"} component={AdminLeads} />
      <Route path={"/shop"} component={Shop} />
      <Route path={"/program"} component={Program} />
      <Route path={"/success"} component={Success} />
      <Route path={"/ref/:code"} component={Referral} />

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
