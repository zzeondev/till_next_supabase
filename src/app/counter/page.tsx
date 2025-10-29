import Countroller from '@/components/conter/Countroller';
import Viewer from '@/components/conter/Viewer';

function CounterPage() {
  return (
    <div>
      <h1 className='text-2xl font-bold'>Counter</h1>
      <Viewer />
      <Countroller />
    </div>
  );
}

export default CounterPage;
