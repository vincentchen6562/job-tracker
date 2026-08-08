import { Hero } from '../components/landing/Hero.jsx';
import { Stats } from '../components/landing/Stats.jsx';
import { HowItWorks } from '../components/landing/HowItWorks.jsx';
import { ComparisonTable } from '../components/landing/ComparisonTable.jsx';
import { FinalCTA } from '../components/landing/FinalCTA.jsx';
import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="wrap">
      <nav>
        <div className="brand">18 Before 18</div>
        <div className="navlinks">
          <a href="#how">How it works</a>
          <Link className="btn primary" to="/login">Log in</Link>
        </div>
      </nav>
      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        <ComparisonTable />
        <FinalCTA />
      </main>
    </div>
  );
}
