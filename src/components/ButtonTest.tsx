import { Button } from './ui/button';

const ButtonTest = () => {
  return (
    <div className='p-6 space-y-4'>
      <h2 className='text-2xl font-bold'>간단한 버튼을</h2>
      <div className='space-y-2'>
        <h3>기본 버튼들</h3>
        <div>
          <Button variant={'secondary'}>기본버튼</Button>
          <Button variant={'destructive'}>기본버튼</Button>
          <Button variant={'outline'}>기본버튼</Button>
          <Button variant={'ghost'}>기본버튼</Button>
          <Button variant={'link'}>기본버튼</Button>
        </div>
      </div>
    </div>
  );
};

export default ButtonTest;
