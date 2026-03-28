'use client';

import { motion } from 'framer-motion';
import AnimatedPage from '@/components/AnimatedPage';
import SearchForm from '@/components/SearchForm';
import { HiOutlineSearch, HiOutlineShieldCheck, HiOutlineLightningBolt } from 'react-icons/hi';

const features = [
  {
    icon: HiOutlineSearch,
    title: 'Phone Lookup',
    description: 'Search any phone number to find associated profiles and tags.',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Secure & Private',
    description: 'All requests are encrypted and processed securely.',
  },
  {
    icon: HiOutlineLightningBolt,
    title: 'Instant Results',
    description: 'Get profile information and tags in milliseconds.',
  },
];

export default function HomePage() {
  return (
    <AnimatedPage>
      <div className="max-w-2xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <motion.h1
            className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            GetContact Web
          </motion.h1>
          <motion.p
            className="text-gray-500 dark:text-gray-400 mt-3 text-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Search phone number profiles and tags instantly
          </motion.p>
        </div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SearchForm />
        </motion.div>

        {/* Features */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="glass-card p-5 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <feature.icon className="w-8 h-8 mx-auto text-teal-500 mb-3" />
              <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
