/**
 * Reports web vitals performance metrics to the provided callback function.
 * Measures Core Web Vitals (CLS, FID, FCP, LCP, TTFB) and other performance metrics.
 * Only reports if a valid callback function is provided.
 * @param {Function} onPerfEntry - Callback function to receive performance metrics
 */
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
