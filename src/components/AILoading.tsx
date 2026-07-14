import './AILoading.css';

export const AILoading = () => {
  return (
    <div className="loading" style={{ transform: 'scale(0.35)', transformOrigin: 'left center', width: 'auto' }}>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
};
