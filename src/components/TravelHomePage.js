import React from "react";
import { motion } from "framer-motion";

const featuredDestinations = [
  { name: "Goa", image: "https://source.unsplash.com/400x300/?goa,beach", price: "₹7,999" },
  { name: "Manali", image: "https://source.unsplash.com/400x300/?manali,mountains", price: "₹8,499" },
  { name: "Jaipur", image: "https://source.unsplash.com/400x300/?jaipur,fort", price: "₹6,999" },
  { name: "Kerala", image: "https://source.unsplash.com/400x300/?kerala,backwaters", price: "₹9,499" },
];

const trendingOffers = [
  { title: "Summer Sale: Up to 40% Off", image: "https://source.unsplash.com/400x200/?travel,offer" },
  { title: "Monsoon Getaways", image: "https://source.unsplash.com/400x200/?monsoon,india" },
  { title: "Family Packages", image: "https://source.unsplash.com/400x200/?family,holiday" },
];

const testimonials = [
  { name: "Amit S.", text: "Booking was seamless and the trip was unforgettable!", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
  { name: "Priya K.", text: "Loved the offers and the support team was super helpful.", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
];

export default function TravelHomePage() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center py-16 px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4"
        >
          Discover Your Next Adventure
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="text-lg md:text-xl text-blue-700 mb-8"
        >
          Flights, Hotels & Holiday Packages at the best prices.
        </motion.p>
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-4 flex flex-col md:flex-row gap-4 w-full max-w-2xl mx-auto"
        >
          <input
            type="text"
            placeholder="Search destination, hotel, or package"
            className="flex-1 px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select className="px-4 py-2 rounded-lg border border-blue-200 focus:outline-none">
            <option>Flights</option>
            <option>Hotels</option>
            <option>Packages</option>
          </select>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
            Search
          </button>
        </motion.div>
      </section>

      {/* Featured Destinations */}
      <section className="py-10 px-4">
        <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">Featured Destinations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {featuredDestinations.map((dest, idx) => (
            <motion.div
              key={dest.name}
              whileHover={{ scale: 1.04, boxShadow: "0 8px 32px rgba(59,130,246,0.15)" }}
              className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col"
            >
              <img src={dest.image} alt={dest.name} className="h-40 w-full object-cover" />
              <div className="p-4 flex-1 flex flex-col justify-between">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">{dest.name}</h3>
                <span className="text-blue-600 font-bold text-xl">{dest.price}</span>
                <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trending Offers Carousel */}
      <section className="py-10 px-4 bg-blue-50">
        <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">Trending Offers</h2>
        <div className="flex gap-6 overflow-x-auto pb-4 max-w-6xl mx-auto">
          {trendingOffers.map((offer, idx) => (
            <motion.div
              key={offer.title}
              whileHover={{ scale: 1.03 }}
              className="min-w-[320px] bg-white rounded-xl shadow-md flex flex-col items-center"
            >
              <img src={offer.image} alt={offer.title} className="h-32 w-full object-cover rounded-t-xl" />
              <div className="p-4 text-blue-800 font-semibold">{offer.title}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 px-4">
        <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">What Our Travelers Say</h2>
        <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.name}
              whileHover={{ scale: 1.03 }}
              className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center"
            >
              <img src={t.avatar} alt={t.name} className="w-16 h-16 rounded-full mb-4" />
              <p className="text-blue-700 mb-2 italic">“{t.text}”</p>
              <span className="font-semibold text-blue-900">{t.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-blue-100 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">TravelSite</h3>
            <p className="text-blue-700">Your gateway to the world. Book flights, hotels, and packages with ease.</p>
          </div>
          <div className="flex gap-6 items-center">
            <a href="mailto:contact@travelsite.com" className="text-blue-600 hover:underline">Contact</a>
            <a href="#" className="text-blue-600 hover:underline">Facebook</a>
            <a href="#" className="text-blue-600 hover:underline">Instagram</a>
            <a href="#" className="text-blue-600 hover:underline">Twitter</a>
          </div>
        </div>
        <div className="text-center text-blue-400 mt-4 text-sm">
          &copy; {new Date().getFullYear()} TravelSite. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
