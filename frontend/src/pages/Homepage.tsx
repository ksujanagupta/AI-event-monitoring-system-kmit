import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheckIcon, VideoIcon, BellIcon, MapPinIcon, UsersIcon, PackageSearchIcon, BrainIcon, ChevronRightIcon, CheckCircleIcon, ArrowRightIcon, GithubIcon, MailIcon, ChevronLeftIcon } from 'lucide-react';
import { motion } from 'framer-motion';
export function Homepage() {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const features = [{
    icon: VideoIcon,
    title: 'AI Surveillance Analysis',
    description: 'Violence, fire, crowd surge, and smoke detection with real-time camera feeds.'
  }, {
    icon: BellIcon,
    title: 'Automated Alerts',
    description: 'Instant alerts for admins, volunteers, and attendees with assignment workflow.'
  }, {
    icon: MapPinIcon,
    title: 'Geo-Location Tracking',
    description: 'Live volunteer locations and issue hotspots shown on an interactive map.'
  }, {
    icon: UsersIcon,
    title: 'Volunteer Management',
    description: 'Approval, status tracking, and task assignment in one place.'
  }, {
    icon: PackageSearchIcon,
    title: 'Lost & Found Assistance',
    description: 'Smart tracking of missing children and lost items.'
  }, {
    icon: BrainIcon,
    title: 'Event Summary AI Chatbot',
    description: 'Chat-based analytics for event insights and reports.'
  }];
  const wireframes = [{
    title: 'Admin Dashboard',
    description: 'Complete overview with stats and real-time monitoring'
  }, {
    title: 'Surveillance System',
    description: 'Multi-camera AI-powered monitoring interface'
  }, {
    title: 'Alerts & Geo-Location',
    description: 'Live map with alert management and volunteer tracking'
  }, {
    title: 'User Management',
    description: 'Volunteer approval and attendee registration system'
  }, {
    title: 'AI Summary Chatbot',
    description: 'Intelligent event analytics and insights'
  }, {
    title: 'Lost & Found',
    description: 'Track missing items and children with AI assistance'
  }];
  const roles = [{
    title: 'Admin',
    color: 'blue',
    features: ['Full system access', 'Manage volunteers', 'Monitor surveillance', 'Track alerts & events']
  }, {
    title: 'Volunteer',
    color: 'green',
    features: ['Face-recognition login', 'Accept tasks', 'View surveillance', 'Update statuses']
  }, {
    title: 'Attendee',
    color: 'purple',
    features: ['Report issues', 'View evacuation plan', 'Receive alerts', 'Lost & found access']
  }];
  const handlePrevSlide = () => {
    setActiveSlide(prev => prev === 0 ? wireframes.length - 1 : prev - 1);
  };
  const handleNextSlide = () => {
    setActiveSlide(prev => prev === wireframes.length - 1 ? 0 : prev + 1);
  };
  return <div className="min-h-screen w-full relative">
      {/* Fixed Background */}
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: 'url(https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&h=1080&fit=crop&q=80)',
      zIndex: -1
    }} />
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-slate-950/95" style={{
      zIndex: -1
    }} />
      {/* Scrollable Content */}
      <div className="relative">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 py-20">
          <div className="text-center max-w-5xl">
            <motion.div initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8
          }}>
              <div className="flex items-center justify-center gap-3 mb-8">
                <motion.div animate={{
                rotate: [0, 10, -10, 0]
              }} transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}>
                  <ShieldCheckIcon className="w-20 h-20 text-blue-400 drop-shadow-[0_0_20px_rgba(96,165,250,0.5)]" />
                </motion.div>
              </div>
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 drop-shadow-2xl leading-tight">
                AI-Powered Event Safety System
              </h1>
              <p className="text-2xl md:text-3xl text-slate-200 mb-12 max-w-4xl mx-auto drop-shadow-lg leading-relaxed">
                Real-time surveillance, automated alerts, volunteer
                coordination, and comprehensive safety management for
                large-scale events.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <motion.button whileHover={{
                scale: 1.05
              }} whileTap={{
                scale: 0.95
              }} onClick={() => navigate('/login')} className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/30">
                  Get Started
                  <ArrowRightIcon className="w-6 h-6" />
                </motion.button>
                <motion.button whileHover={{
                scale: 1.05
              }} whileTap={{
                scale: 0.95
              }} onClick={() => document.getElementById('features')?.scrollIntoView({
                behavior: 'smooth'
              })} className="px-10 py-5 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-xl font-bold text-xl transition-all border border-white/20 shadow-2xl">
                  Learn More
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>
        {/* Features Section */}
        <section id="features" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }}>
              <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-6 drop-shadow-lg">
                What Our System Does
              </h2>
              <p className="text-slate-300 text-center mb-20 text-xl max-w-3xl mx-auto">
                Comprehensive event safety powered by cutting-edge artificial
                intelligence
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => <motion.div key={index} initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1
            }} whileHover={{
              y: -8,
              scale: 1.02
            }} className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all shadow-2xl">
                  <div className="w-16 h-16 rounded-xl bg-blue-600/20 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                    <feature.icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>)}
            </div>
          </div>
        </section>
        {/* How It Works */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }}>
              <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-24 drop-shadow-lg">
                How the System Works
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              {[{
              step: 1,
              title: 'AI Detects Issue',
              desc: 'From CCTV feeds'
            }, {
              step: 2,
              title: 'Alerts Generated',
              desc: 'Automatically'
            }, {
              step: 3,
              title: 'Admin Assigns',
              desc: 'To volunteers'
            }, {
              step: 4,
              title: 'Resolution',
              desc: 'Update status'
            }].map((item, index) => <motion.div key={index} initial={{
              opacity: 0,
              scale: 0.8
            }} whileInView={{
              opacity: 1,
              scale: 1
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.15
            }} className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white text-4xl font-bold flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/30">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-300 text-lg">{item.desc}</p>
                </motion.div>)}
            </div>
          </div>
        </section>
        {/* User Roles */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }}>
              <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-24 drop-shadow-lg">
                User Roles
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {roles.map((role, index) => <motion.div key={index} initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1
            }} whileHover={{
              y: -8
            }} className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-10 shadow-2xl">
                  <h3 className="text-3xl font-bold text-white mb-8">
                    {role.title}
                  </h3>
                  <ul className="space-y-4">
                    {role.features.map((feature, i) => <li key={i} className="flex items-center gap-3">
                        <CheckCircleIcon className={`w-6 h-6 text-${role.color}-400 flex-shrink-0`} />
                        <span className="text-slate-200 text-lg">
                          {feature}
                        </span>
                      </li>)}
                  </ul>
                </motion.div>)}
            </div>
          </div>
        </section>
        {/* Wireframe Carousel */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }}>
              <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-24 drop-shadow-lg">
                Live Features Preview
              </h2>
            </motion.div>
            <div className="relative">
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-16 aspect-video flex items-center justify-center shadow-2xl">
                <motion.div key={activeSlide} initial={{
                opacity: 0,
                scale: 0.9
              }} animate={{
                opacity: 1,
                scale: 1
              }} className="text-center">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mx-auto mb-6 shadow-2xl shadow-blue-500/30" />
                  <h3 className="text-3xl font-bold text-white mb-4">
                    {wireframes[activeSlide].title}
                  </h3>
                  <p className="text-slate-300 text-xl">
                    {wireframes[activeSlide].description}
                  </p>
                </motion.div>
              </div>
              <button onClick={handlePrevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-slate-900/80 backdrop-blur-sm hover:bg-slate-800 text-white rounded-full transition-all border border-slate-700 hover:border-blue-500 shadow-xl" aria-label="Previous slide">
                <ChevronLeftIcon className="w-7 h-7" />
              </button>
              <button onClick={handleNextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-slate-900/80 backdrop-blur-sm hover:bg-slate-800 text-white rounded-full transition-all border border-slate-700 hover:border-blue-500 shadow-xl" aria-label="Next slide">
                <ChevronRightIcon className="w-7 h-7" />
              </button>
              <div className="flex justify-center gap-3 mt-8">
                {wireframes.map((_, index) => <button key={index} onClick={() => setActiveSlide(index)} className={`h-3 rounded-full transition-all ${activeSlide === index ? 'bg-blue-500 w-12' : 'bg-slate-700 w-3 hover:bg-slate-600'}`} />)}
              </div>
            </div>
          </div>
        </section>
        {/* Problem & Solution */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }}>
              <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-24 drop-shadow-lg">
                Why This System?
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div initial={{
              opacity: 0,
              x: -20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} className="bg-red-900/20 backdrop-blur-xl border border-red-800/50 rounded-2xl p-10 shadow-2xl">
                <h3 className="text-3xl font-bold text-red-400 mb-6">
                  Problem
                </h3>
                <p className="text-slate-200 text-lg leading-relaxed">
                  Large events face critical safety issues: crowd surges,
                  violence, fire hazards, missing children, and uncoordinated
                  volunteer response.
                </p>
              </motion.div>
              <motion.div initial={{
              opacity: 0,
              x: 20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} className="bg-green-900/20 backdrop-blur-xl border border-green-800/50 rounded-2xl p-10 shadow-2xl">
                <h3 className="text-3xl font-bold text-green-400 mb-6">
                  Solution
                </h3>
                <p className="text-slate-200 text-lg leading-relaxed">
                  Our system uses AI, automation, and real-time mapping to
                  ensure comprehensive event safety and rapid emergency
                  response.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
        {/* Tech Stack */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }}>
              <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-24 drop-shadow-lg">
                Tech Stack
              </h2>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[{
              label: 'React',
              desc: 'Frontend Framework'
            }, {
              label: 'Tailwind CSS',
              desc: 'Styling'
            }, {
              label: 'Node.js',
              desc: 'Backend'
            }, {
              label: 'MongoDB',
              desc: 'Database'
            }, {
              label: 'YOLO / Deep Learning',
              desc: 'AI Models'
            }, {
              label: 'Leaflet',
              desc: 'Maps'
            }].map((tech, index) => <motion.div key={index} initial={{
              opacity: 0,
              scale: 0.9
            }} whileInView={{
              opacity: 1,
              scale: 1
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.05
            }} whileHover={{
              scale: 1.05
            }} className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8 text-center shadow-xl">
                  <h4 className="text-xl font-bold text-white mb-2">
                    {tech.label}
                  </h4>
                  <p className="text-slate-400">{tech.desc}</p>
                </motion.div>)}
            </div>
          </div>
        </section>
        {/* CTA */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }}>
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-10 drop-shadow-lg">
                Ready to explore the system?
              </h2>
              <motion.button whileHover={{
              scale: 1.05
            }} whileTap={{
              scale: 0.95
            }} onClick={() => navigate('/login')} className="px-16 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-2xl transition-all inline-flex items-center gap-4 shadow-2xl shadow-blue-500/30">
                Get Started
                <ChevronRightIcon className="w-7 h-7" />
              </motion.button>
            </motion.div>
          </div>
        </section>
        {/* Footer */}
        <footer className="border-t border-slate-700/50 py-16 px-6 backdrop-blur-xl bg-slate-950/50">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-3">
                  EventGuard AI
                </h3>
                <p className="text-slate-400 text-lg">Hackathon Project 2024</p>
              </div>
              <div className="flex items-center gap-8">
                <a href="mailto:team@eventguard.ai" className="text-slate-400 hover:text-white transition-colors flex items-center gap-3 text-lg">
                  <MailIcon className="w-6 h-6" />
                  Contact
                </a>
                <a href="https://github.com" className="text-slate-400 hover:text-white transition-colors flex items-center gap-3 text-lg">
                  <GithubIcon className="w-6 h-6" />
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>;
}