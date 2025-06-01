import { Link } from 'react-router-dom';
import { Utensils, QrCode, LayoutDashboard, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container-custom flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Utensils className="mr-2 h-6 w-6 text-primary-500" />
            <span className="text-lg font-bold">QR Menu</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="btn-outline">
              Log in
            </Link>
            <Link to="/register" className="btn-primary">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16 md:py-24">
        <div className="container-custom">
          <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
            <div className="flex flex-col justify-center">
              <h1 className="mb-4 text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
                Modern ordering for modern restaurants
              </h1>
              <p className="mb-6 text-xl text-gray-600">
                Create digital menus with QR codes, manage orders, and delight your customers with a seamless dining experience.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link to="/register" className="btn-primary">
                  Get started for free
                </Link>
                <Link to="/login" className="btn-outline">
                  Log in to your account
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <img
                src="https://images.pexels.com/photos/6205791/pexels-photo-6205791.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Restaurant QR code ordering"
                className="h-auto w-full max-w-md rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container-custom">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-4xl">
            Everything you need to run your restaurant
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="card flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary-100 p-4 text-primary-500">
                <QrCode size={32} />
              </div>
              <h3 className="mb-2 text-xl font-bold">QR Code Menus</h3>
              <p className="text-gray-600">
                Create unique QR codes for each table. Customers can scan and order directly from their phones.
              </p>
            </div>
            <div className="card flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-secondary-100 p-4 text-secondary-500">
                <LayoutDashboard size={32} />
              </div>
              <h3 className="mb-2 text-xl font-bold">Admin Dashboard</h3>
              <p className="text-gray-600">
                Manage your menu, track orders, and update your restaurant information all in one place.
              </p>
            </div>
            <div className="card flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-accent-100 p-4 text-accent-600">
                <Utensils size={32} />
              </div>
              <h3 className="mb-2 text-xl font-bold">Order Management</h3>
              <p className="text-gray-600">
                Receive and manage orders in real-time. Update order status and keep your customers informed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-500 py-16 text-white md:py-20">
        <div className="container-custom text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Ready to transform your restaurant?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90">
            Join thousands of restaurants already using QR Menu to improve their customer experience and streamline operations.
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 font-medium text-primary-500 transition-colors hover:bg-gray-100"
          >
            Get started today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white py-8">
        <div className="container-custom">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center">
              <Utensils className="mr-2 h-5 w-5 text-primary-500" />
              <span className="text-lg font-bold">QR Menu</span>
            </div>
            <div className="text-center text-sm text-gray-600 md:text-right">
              &copy; {new Date().getFullYear()} QR Menu. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;