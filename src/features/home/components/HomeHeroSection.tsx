import Link from 'next/link';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HomeHeroSection() {
  return (
    <section id="tour-dashboard-hero" className="space-y-3 sm:space-y-4 xl:space-y-6">
      <div className="space-y-1.5 sm:space-y-2.5">
        <h1
          className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-tight leading-tight"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Master Your Boards,<br />
          <span className="text-primary font-semibold">Level Up Your Knowledge</span>
        </h1>
      </div>
      <Link href="/quest" className="inline-block">
        <Button
          size="lg"
          className="h-10 sm:h-11 xl:h-12 px-5 sm:px-7 xl:px-8 rounded-xl mt-1 sm:mt-2 text-xs sm:text-sm font-medium shadow-lg bg-primary hover:bg-primary/90"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Start Quest <Zap className="h-4 w-4 sm:h-5 sm:w-5 ml-2 fill-current" />
        </Button>
      </Link>
    </section>
  );
}

