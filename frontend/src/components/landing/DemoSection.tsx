import { motion } from 'framer-motion';
import { DemoJobDetail } from './DemoJobDetail';

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

const DemoSection = () => {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeIn}
      className="py-24 bg-gray-50 hidden md:block"
    >
      <div className="container mx-auto px-4">
        <motion.div
          variants={slideIn}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Interactive Demo</h2>
          <p className="text-xl text-gray-600">
            Experience Claire's capabilities firsthand. Select a sample recording to explore our transcription and analysis features.
          </p>
        </motion.div>

        <DemoJobDetail />
      </div>
    </motion.section>
  );
};

export default DemoSection;
