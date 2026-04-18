import Link from 'next/link';
import { ArrowRight, ShoppingBag, Store, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import FeaturedBusinesses from '@/components/features/business/featured-businesses';

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-primary/10 py-24 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Shelflyd — Africa&apos;s Multi-Tenant
            <span className="text-primary"> Marketplace</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover thousands of businesses, shop fresh produce, and connect with sellers across Africa.
            Start your own storefront in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-primary text-primary-foreground hover:opacity-90">
              <Link href="/businesses">
                Browse Businesses <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/register">Start Selling</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-white border-y border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { icon: Store, label: 'Active Businesses', value: '500+' },
            { icon: ShoppingBag, label: 'Products Listed', value: '12,000+' },
            { icon: Users, label: 'Happy Customers', value: '35,000+' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="space-y-2">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold">{value}</div>
              <div className="text-muted-foreground text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Featured Businesses</h2>
            <Button variant="outline" asChild>
              <Link href="/businesses">View All</Link>
            </Button>
          </div>
          <FeaturedBusinesses limit={6} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">Ready to grow your business?</h2>
          <p className="text-primary-foreground/80 text-lg">
            Create your storefront, list your products, and start selling to customers across Africa.
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 font-semibold"
            asChild
          >
            <Link href="/auth/register">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Create an Account',
                desc: 'Sign up in seconds and set up your profile.',
              },
              {
                step: '2',
                title: 'Register Your Business',
                desc: 'Add your business details and get approved quickly.',
              },
              {
                step: '3',
                title: 'Start Selling',
                desc: 'List products and receive orders from customers.',
              },
            ].map(({ step, title, desc }) => (
              <Card key={step} className="text-center">
                <CardContent className="pt-6 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground text-lg font-bold flex items-center justify-center mx-auto">
                    {step}
                  </div>
                  <h3 className="font-semibold text-lg">{title}</h3>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
