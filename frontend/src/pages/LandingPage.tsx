import { useRef, useEffect, useState, lazy, Suspense } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FileAudio, Share2, Brain, ArrowRight, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import AnimatedMesh from '@/components/landing/AnimatedMesh';
import BloomScene from '@/components/landing/BloomScene';
import useAudioAnalyzer from '@/hooks/useAudioAnalyzer';
import { Badge } from '@/components/ui/badge';
const LazyDemoSection = lazy(() => import('@/components/landing/DemoSection'));
const LazyVideoSection = lazy(() => import('@/components/landing/VideoSection'));

// Enhanced animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};
const scenarios = [
  {
    value: "meetings",
    title: "Team Meetings & Collaboration",
    description: "Never miss a detail in your meetings. Claire automatically identifies speakers, tracks action items, and makes your meetings searchable."
  },
  {
    value: "lectures",
    title: "Academic Lectures & Research",
    description: "Transform lengthy lectures into organized study materials. Extract key concepts, create summaries, and interact with your notes."
  },
  {
    value: "content",
    title: "Content Creation & Podcasting",
    description: "Streamline your content production workflow. Get transcripts, summaries, and key points from your recordings instantly."
  },
  {
    value: "personal",
    title: "Personal Voice Notes",
    description: "Turn your thoughts into organized, actionable information. Claire helps you capture and structure your ideas effectively."
  }
]

const phrases = [
  "Actionable Intelligence",
  "Searchable Knowledge",
  "Organized Insights",
  "Smart Transcripts"
];

// New: Dynamic typing effect for the hero title’s last part
const TypingText = () => {
  const [displayedText, setDisplayedText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const typingSpeed = 150; // milliseconds per character
  const pauseTime = 2000;  // milliseconds to pause at end of phrase

  useEffect(() => {
    if (charIndex < phrases[phraseIndex].length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + phrases[phraseIndex][charIndex]);
        setCharIndex(charIndex + 1);
      }, typingSpeed);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setDisplayedText("");
        setCharIndex(0);
        setPhraseIndex((phraseIndex + 1) % phrases.length);
      }, pauseTime);
      return () => clearTimeout(timeout);
    }
  }, [charIndex, phraseIndex, phrases]);

  return (
    <span className="inline-block text-primary ">
      {displayedText}
      <span className="border-r-2 border-primary animate-pulse ml-1"></span>
    </span>
  );
};


const LandingPage = () => {
  const { scrollY } = useScroll();
  const heroRef = useRef(null);
  const videoRef = useRef<HTMLElement>(null);
  const isHeroInView = useInView(heroRef);
  const videoInView = useInView(videoRef);
  const frequency = useAudioAnalyzer();

  const scrollToVideo = () => {
    videoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    document.title = 'Claire - Audio & Video Intelligence Platform';
  }, []);



  const heroY = useTransform(scrollY, [0, 500], [0, 200]);
  // const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ y: heroY, }}
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-foreground/5 to-background"
      >
        <div className="absolute inset-0 z-0">
          <Canvas>
            <ambientLight intensity={0.5} />
            <BloomScene frequencyRef={frequency} />
            <AnimatedMesh
              ready={true}
              frequencyRef={frequency}
            />
          </Canvas>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial="hidden"
            animate={isHeroInView ? "visible" : "hidden"}
            variants={fadeIn}
            className="mb-8"
          >
            <motion.h1
              className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              Claire
            </motion.h1>
            <motion.h2
              className="text-4xl md:text-6xl font-bold text-black min-h-[80px] md:min-h-[120px] flex flex-col items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Transform Your Audio & Video Content into{' '}
              <span className="min-h-[40px] md:min-h-[60px] flex items-center">
                <TypingText />
              </span>
            </motion.h2>
          </motion.div>
          <motion.p
            initial="hidden"
            animate={isHeroInView ? "visible" : "hidden"}
            variants={fadeIn}
            className="text-xl text-gray-600 mb-8"
          >
            From meetings to lectures, Claire turns spoken words into organized, searchable knowledge - in seconds.
          </motion.p>
          <motion.div
            initial="hidden"
            animate={isHeroInView ? "visible" : "hidden"}
            variants={fadeIn}
            className="space-x-4"
          >
            <Button size="lg" asChild>
              <Link to="/login" className="group bg-primary hover:bg-primary/90 inline-flex items-center font-semibold">
                Try Claire Free<ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary/20 hover:bg-primary/10" onClick={scrollToVideo}>
              See How It Works
            </Button>
          </motion.div>
        </div>
      </motion.section>

      <Suspense fallback={
        <div className="py-24 relative z-10 bg-background">
          <div className="container mx-auto px-4 flex items-center justify-center">
            <div className="animate-pulse w-full max-w-4xl h-[600px] bg-gray-200 rounded-xl" />
          </div>
        </div>
      }>
        <LazyVideoSection />
      </Suspense>

      <Suspense fallback={
        <div className="py-24 bg-gray-50 hidden md:block">
          <div className="container mx-auto px-4 flex items-center justify-center">
            <div className="animate-pulse w-full max-w-3xl h-[600px] bg-gray-200 rounded-xl" />
          </div>
        </div>
      }>
        <LazyDemoSection />
      </Suspense>

      {/* How It Works Video Section */}
      {/* <motion.section
        ref={videoRef}
        initial="hidden"
        animate={videoInView ? "visible" : "hidden"}
        variants={fadeIn}
        className="py-24 relative z-10 bg-background"
      >
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            className="text-4xl font-bold mb-8 text-black"
            variants={slideIn}
          >
            See How Claire Works
          </motion.h2>
          <motion.div
            className="relative max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl"
            variants={fadeIn}
          >
            <iframe
              width="100%"
              height="600"
              src="https://www.youtube.com/embed/vLWeJZLV2qM?autoplay=1&loop=1&playlist=vLWeJZLV2qM"
              title="How Claire Works"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-xl"
            />
          </motion.div>
        </div>
      </motion.section> */}

      {/* Enhanced Social Proof Bar */}
      {/* <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-16 bg-primary/5 border-y border-primary/10 relative z-20"
      >
        <div className="container mx-auto px-4 text-center">
          <motion.p
            className="text-xl font-medium mb-12 text-primary"
            variants={slideIn}
          >
            Trusted by Leading Organizations
          </motion.p>
          <div className="grid grid-cols-3 gap-12 items-center max-w-4xl mx-auto">
            <motion.img
              src="/images/claire-upload.png"
              alt="Upload Feature"
              className="h-16 rounded-lg shadow-lg hover:shadow-primary/20 transition-all duration-300 object-contain bg-primary/10"
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            />
            <motion.img
              src="/images/claire-sharing.png"
              alt="Sharing Feature"
              className="h-16 rounded-lg shadow-lg hover:shadow-primary/20 transition-all duration-300 object-contain bg-primary/10"
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            />
            <motion.img
              src="/images/claire-business-summary.png"
              alt="Business Summary Feature"
              className="h-16 rounded-lg shadow-lg hover:shadow-primary/20 transition-all duration-300 object-contain bg-primary/10"
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            />
          </div>
        </div>
      </motion.section> */}

      {/* Main Benefits */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <FileAudio className="w-12 h-12 mb-6 text-primary" />,
                title: "Never Miss Important Details",
                description: "Claire captures everything from your recordings - speakers, action items, and key concepts - organized and ready to use."
              },
              {
                icon: <Share2 className="w-12 h-12 mb-6 text-primary" />,
                title: "Share Knowledge Effortlessly",
                description: "One click to share your enhanced transcripts and insights with teammates or create public access links."
              },
              {
                icon: <Brain className="w-12 h-12 mb-6 text-primary" />,
                title: "Interactive Intelligence",
                description: "Chat with your content to extract specific information or get clarification on complex topics."
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="text-center p-6"
              >
                {benefit.icon}
                <h3 className="text-2xl font-semibold mb-4">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-4">
          {[
            {
              title: "Smart Transcription",
              description: "Crystal-clear transcripts with speaker identification, automatically organized by topics and speakers.",
              // Replace with actual screenshot
              image: "/images/claire-lecture-transcription.png"
            },
            {
              title: "AI-Enhanced Summaries",
              description: "Get the essence of any recording in seconds. Key points, action items, and concepts automatically extracted.",
              image: "/images/claire-business-summary.png"
            },
            {
              title: "Interactive Experience",
              description: "Ask questions, extract specific information, or dive deeper into any topic. Your content becomes a knowledge base you can actually talk to.",
              image: "/images/claire-lecture-ai.png"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className={`flex items-center gap-12 mb-24 ${index % 2 === 1 ? 'flex-row-reverse' : ''
                }`}
            >
              <div className="flex-1">
                <h3 className="text-3xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-lg text-muted-foreground mb-6">{feature.description}</p>
                <Button variant="outline">Learn More</Button>
              </div>
              <div className="flex-1">
                <Card>
                  <CardContent className="p-0">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-auto rounded-lg"
                    />
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Usage Scenarios */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Perfect for Every Scenario</h2>

          {/* Tabs - Visible on desktop */}
          <div className="hidden sm:block">
            <Tabs defaultValue="meetings" className="max-w-3xl mx-auto">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="meetings">Team Meetings</TabsTrigger>
                <TabsTrigger value="lectures">Academic Lectures</TabsTrigger>
                <TabsTrigger value="content">Content Creation</TabsTrigger>
                <TabsTrigger value="personal">Personal Notes</TabsTrigger>
              </TabsList>
              {scenarios.map((scenario) => (
                <TabsContent key={scenario.value} value={scenario.value}>
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-2xl font-semibold mb-4">{scenario.title}</h3>
                      <p className="text-muted-foreground">{scenario.description}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Accordion - Visible on mobile */}
          <div className="sm:hidden space-y-4">
            <Accordion type="single" defaultValue="scenario-0" collapsible className="w-full">
              {scenarios.map((scenario, index) => (
                <AccordionItem key={index} value={`scenario-${index}`}>
                  <AccordionTrigger className="text-foreground">{scenario.title}</AccordionTrigger>
                  <AccordionContent>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-foreground">{scenario.description}</p>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section><section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="relative border-primary/20">
              <CardContent className="pt-6">
                <div className="mb-6">
                  <Badge variant="outline" className="mb-4">Free Demo</Badge>
                  <h3 className="text-3xl font-bold">$0<span className="text-lg text-muted-foreground">/month</span></h3>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 mr-2 text-green-500" />300 credits/month
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 mr-2 text-green-500" />Max 30 minute files
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 mr-2 text-green-500" />AI Summaries
                  </li>
                  <li className="flex items-center">
                    <X className="w-5 h-5 mr-2 text-red-500" />Chat with recordings
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link to="/login">Get Started Free</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative border-primary/40 bg-primary/5">
              <CardContent className="pt-6">
                <div className="mb-6">
                  <Badge className="mb-4 bg-purple-600">Pro Tier</Badge>
                  <h3 className="text-3xl font-bold">Coming Soon<span className="text-lg text-muted-foreground"></span></h3>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 mr-2 text-green-500" />5000 credits/month
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 mr-2 text-green-500" />Up to 2 hour files
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 mr-2 text-green-500" />AI Summaries
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 mr-2 text-green-500" />Chat with recordings
                  </li>
                </ul>
                <Button disabled className="w-full bg-purple-600 hover:bg-purple-700" asChild>
                  <Link to="/">Upgrade to Pro</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-4 max-w-4xl">
          <h3 className="text-2xl font-bold text-center mb-8">Feature Comparison</h3>
          <div className="border rounded-lg bg-background">
            <div className="grid grid-cols-3 items-center border-b p-4">
              <span className="font-medium">Feature</span>
              <span className="text-center">Free</span>
              <span className="text-center">Pro</span>
            </div>
            {[
              ['Monthly Credits', '300', '5000'],
              ['Max File Duration', '30 mins', '2 hours'],
              ['AI Summaries', '✓', '✓'],
              ['Multi-speaker Detection', '✓', '✓'],
              ['Custom Vocabularies', '✕', '✓'],
              ['Priority Support', '✕', '✓'],
            ].map(([feature, free, pro]) => (
              <div key={feature} className="grid grid-cols-3 items-center border-b p-4">
                <span className="text-muted-foreground">{feature}</span>
                <span className="text-center">{free}</span>
                <span className="text-center">{pro}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible>
            {[
              {
                question: "What file formats are supported?",
                answer: "Claire supports all major audio and video formats including MP3, WAV, MP4, and more. Simply upload your file and we'll handle the rest."
              },
              {
                question: "How long does processing take?",
                answer: "Most files are processed within minutes. Processing time depends on the file length and complexity."
              },
              {
                question: "Is my data secure?",
                answer: "We take security seriously. All files are encrypted in transit and at rest, and you have complete control over sharing settings."
              },
              {
                question: "What's included in the demo?",
                answer: "Try Claire with our generous demo quota. You'll get access to all features including transcription, summaries, and chat capabilities."
              }
            ].map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="py-24 text-center bg-background"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-6">Start Converting Your Audio & Video Today</h2>
          <p className="text-xl text-muted-foreground mb-8">Try Claire with our free demo quota</p>
          <Button size="lg" className="group">
            Get Started Free
            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">No credit card required</p>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-12 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Claire</h3>
              <p className="text-sm text-muted-foreground">Transform your audio and video content into actionable intelligence.</p>
            </div>
            {/* <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm text-muted-foreground hover:text-primary">Features</a></li>
                <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-primary">Pricing</a></li>
                <li><a href="#demo" className="text-sm text-muted-foreground hover:text-primary">Demo</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#docs" className="text-sm text-muted-foreground hover:text-primary">Documentation</a></li>
                <li><a href="#blog" className="text-sm text-muted-foreground hover:text-primary">Blog</a></li>
                <li><a href="#support" className="text-sm text-muted-foreground hover:text-primary">Support</a></li>
              </ul>
            </div> */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="https://giacomocap.github.io/blog/" className="text-sm text-muted-foreground hover:text-primary">About</a></li>
                {/* <li><a href="#privacy" className="text-sm text-muted-foreground hover:text-primary">Privacy</a></li>
                <li><a href="#terms" className="text-sm text-muted-foreground hover:text-primary">Terms</a></li> */}
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Claire by Giacomo Cappellozza. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
