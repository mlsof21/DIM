import { AnimatePresence, Orchestration, Tween, Variants, motion } from 'framer-motion';
import _ from 'lodash';
import styles from './Loading.m.scss';

const containerAnimateVariants: Variants = {
  initial: { opacity: 0 },
  open: { opacity: 1 },
};
const containerAnimateTransition: Tween & Orchestration = {
  duration: 0.5,
  delay: 1,
};

const messageAnimateVariants: Variants = {
  initial: { y: -16, opacity: 0 },
  open: { y: 0, opacity: 1 },
  leave: { y: 16, opacity: 0 },
};
const messageAnimateTransition: Tween = { duration: 0.2, ease: 'easeOut' };

export function Loading({ message }: { message?: string }) {
  return (
    <section className={styles.loading}>
      <div className={styles.container}>
        {_.times(16, (n) => (
          <div key={n} className={styles.square} />
        ))}
      </div>

      <motion.div
        className={styles.textContainer}
        initial="initial"
        animate="open"
        variants={containerAnimateVariants}
        transition={containerAnimateTransition}
      >
        <AnimatePresence>
          {message && (
            <motion.div
              key={message}
              className={styles.text}
              initial="initial"
              animate="open"
              exit="leave"
              variants={messageAnimateVariants}
              transition={messageAnimateTransition}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
