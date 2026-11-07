import Image from 'next/image';

export function InstitutionalLogos() {
  return (
    <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2.5 sm:gap-3.5 select-none pointer-events-auto">
      <div className="relative w-11 h-11 sm:w-14 sm:h-14 transition-transform hover:scale-105 duration-200">
        <Image
          src="/images/login-signup/SWU_Logo.png"
          alt="Southwestern University PHINMA Logo"
          width={64}
          height={64}
          priority
          className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
        />
      </div>
      <div className="relative w-11 h-11 sm:w-14 sm:h-14 transition-transform hover:scale-105 duration-200">
        <Image
          src="/images/login-signup/MedTech_Logo.png"
          alt="Medical Technology Logo"
          width={64}
          height={64}
          priority
          className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
        />
      </div>
    </div>
  );
}

