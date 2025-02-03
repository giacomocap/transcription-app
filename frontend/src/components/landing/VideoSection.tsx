import { motion } from 'framer-motion';

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

const VideoSection = () => {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
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
            loading="lazy"
          />
        </motion.div>
      </div>
    </motion.section>
  );
};

export default VideoSection;
