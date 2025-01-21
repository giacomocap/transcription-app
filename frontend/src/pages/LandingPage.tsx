import { useRef, useEffect } from 'react';
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
import { FileAudio, Share2, Brain, ArrowRight } from 'lucide-react';

// Animation variants for fading in elements
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

const LandingPage = () => {
  const { scrollY } = useScroll();
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef);

  useEffect(() => {
    document.title = 'Claire - Audio & Video Intelligence Platform';
  }, []);

  // Parallax effect for hero section
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);

  // Animated wave background component
  const WaveBackground = () => (
    <div className="absolute inset-0 overflow-hidden opacity-10">
      <svg className="w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path
          d="M0,0 C300,30 600,90 1200,80 L1200,120 L0,120 Z"
          className="fill-primary/20"
        >
          <animate
            attributeName="d"
            dur="5s"
            repeatCount="indefinite"
            values="M0,0 C300,30 600,90 1200,80 L1200,120 L0,120 Z;
                    M0,0 C300,60 600,30 1200,100 L1200,120 L0,120 Z;
                    M0,0 C300,30 600,90 1200,80 L1200,120 L0,120 Z"
          />
        </path>
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ y: heroY }}
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background"
      >
        <WaveBackground />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial="hidden"
            animate={isHeroInView ? "visible" : "hidden"}
            variants={fadeIn}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">Claire</h1>
            <h2 className="text-6xl font-bold">Transform Your Audio & Video Content into Actionable Intelligence</h2>
          </motion.div>
          <motion.p
            initial="hidden"
            animate={isHeroInView ? "visible" : "hidden"}
            variants={fadeIn}
            className="text-xl text-muted-foreground mb-8"
          >
            From meetings to lectures, Claire turns spoken words into organized, searchable knowledge - in seconds.
          </motion.p>
          <motion.div
            initial="hidden"
            animate={isHeroInView ? "visible" : "hidden"}
            variants={fadeIn}
            className="space-x-4"
          >
            <Button size="lg" className="group">
              Try Claire Free
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline">
              See How It Works
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Social Proof Bar */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-16 bg-primary/5 border-y border-primary/10"
      >
        <div className="container mx-auto px-4 text-center">
          <p className="text-xl font-medium mb-12 text-primary">Trusted by Leading Organizations</p>
          <div className="grid grid-cols-3 gap-12 items-center max-w-4xl mx-auto">
            {/* Replace with actual logos */}
            <div className="h-16 bg-primary/10 rounded-lg shadow-sm hover:bg-primary/15 transition-colors" />
            <div className="h-16 bg-primary/10 rounded-lg shadow-sm hover:bg-primary/15 transition-colors" />
            <div className="h-16 bg-primary/10 rounded-lg shadow-sm hover:bg-primary/15 transition-colors" />
          </div>
        </div>
      </motion.section>

      {/* Main Benefits */}
      <section className="py-24">
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
      <section className="py-24 bg-muted">
        <div className="container mx-auto px-4">
          {[
            {
              title: "Smart Transcription",
              description: "Crystal-clear transcripts with speaker identification, automatically organized by topics and speakers.",
              // Replace with actual screenshot
              image: "/api/placeholder/600/400"
            },
            {
              title: "AI-Enhanced Summaries",
              description: "Get the essence of any recording in seconds. Key points, action items, and concepts automatically extracted.",
              image: "/api/placeholder/600/400"
            },
            {
              title: "Interactive Experience",
              description: "Ask questions, extract specific information, or dive deeper into any topic. Your content becomes a knowledge base you can actually talk to.",
              image: "/api/placeholder/600/400"
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
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Perfect for Every Scenario</h2>
          <Tabs defaultValue="meetings" className="max-w-3xl mx-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="meetings">Team Meetings</TabsTrigger>
              <TabsTrigger value="lectures">Academic Lectures</TabsTrigger>
              <TabsTrigger value="content">Content Creation</TabsTrigger>
              <TabsTrigger value="personal">Personal Notes</TabsTrigger>
            </TabsList>
            {[
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
            ].map((scenario) => (
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
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted">
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
        className="py-24 text-center"
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
      <footer className="py-12 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Claire</h3>
              <p className="text-sm text-muted-foreground">Transform your audio and video content into actionable intelligence.</p>
            </div>
            <div>
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
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#about" className="text-sm text-muted-foreground hover:text-primary">About</a></li>
                <li><a href="#privacy" className="text-sm text-muted-foreground hover:text-primary">Privacy</a></li>
                <li><a href="#terms" className="text-sm text-muted-foreground hover:text-primary">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Claire. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;