// 📁 src/components/layout/FreeHeader.tsx

'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button/Button'
import Image from 'next/image';

export default function FreeHeader() {
  const handleLogin = () => {
    alert('로그인 처리!');
  };

  return (
    <>
      {/* ========== HEADER ========== */}
      <header className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md z-50">
        {/* Topbar */}
        <div className="py-2">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-end items-center">
            <div className="flex items-center gap-x-2">
              {/* 1. 기본 Primary 버튼 */}
              <Button variant="secondary" onClick={handleLogin}>
                Sign In
              </Button>

              <Button variant="primary" onClick={handleLogin}>
                Get Started
              </Button>
              <Link
                href="/my-page" // 1. a태그를 Link로 바꾸고 실제 내부 경로를 적어줍니다.
                aria-label="profile"
                className="rounded-full overflow-hidden shadow-md"
              >
                <Image
                  src="/2.png" // '/public'은 경로에 쓰지 않습니다.
                  alt="Profile"
                  width={32} // 이미지의 실제 너비
                  height={32} // 이미지의 실제 높이
                  priority // 첫 화면에 보이는 중요한 이미지라면 priority를 추가해 먼저 로드합니다.
                />
                <span className="sr-only">Profile</span>
              </Link>
            </div>
          </div>
        </div>
        {/* End Topbar */}

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            href="/"
            aria-label="Brand"
            className="font-bold text-2xl tracking-wide"
          >
            Brand
          </Link>
          <button
            type="button"
            className="hs-collapse-toggle relative size-9 flex justify-center items-center font-medium rounded-lg text-white md:hidden hover:bg-purple-800/30 focus:outline-none focus:bg-purple-800/30 disabled:opacity-50 disabled:pointer-events-none"
            aria-expanded="false"
            aria-controls="hs-header-base"
            aria-label="Toggle navigation"
            data-hs-collapse="#hs-header-base"
          >
            <svg
              className="hs-collapse-open:hidden size-5"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" x2="21" y1="6" y2="6" />
              <line x1="3" x2="21" y1="12" y2="12" />
              <line x1="3" x2="21" y1="18" y2="18" />
            </svg>
            <svg
              className="hs-collapse-open:block shrink-0 hidden size-5"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            <span className="sr-only">Toggle navigation</span>
          </button>

          <nav
            id="hs-header-base"
            className="hs-collapse hidden overflow-hidden transition-all duration-300 basis-full grow md:block md:basis-auto md:!flex md:justify-end md:gap-10"
            aria-labelledby="hs-header-base-collapse"
          >
            <ul className="flex flex-col md:flex-row md:gap-8 p-4 md:p-0">
              <li>
                {' '}
                <a
                  href="#"
                  aria-current="page"
                  className="font-medium py-2 block rounded-md focus:outline-none focus:text-indigo-200 hover:text-indigo-200"
                >
                  Home
                </a>
              </li>

              <li>
                <div className="hs-dropdown md:[--trigger:hover] [--placement:bottom-end] [--strategy:absolute]">
                  <button
                    type="button"
                    className="hs-dropdown-toggle py-2 font-medium focus:outline-none focus:text-indigo-200 hover:text-indigo-200 block flex gap-0.5 items-center"
                  >
                    Features
                    <svg
                      className="w-3 h-3 transition-transform duration-300"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  <div
                    className="hs-dropdown-menu transition-[opacity,margin] duration-[0.1ms] md:duration-[150ms] hs-dropdown-open:opacity-100 opacity-0 hidden z-10 md:top-full md:w-44 bg-white/80 dark:bg-neutral-800 shadow-md md:rounded-md ring-1 ring-white/10 backdrop-blur-sm before:hidden md:before:block before:absolute before:-top-3 before:start-2 before:h-3 before:w-full after:hidden md:after:block after:absolute after:top-0 after:start-3 after:w-1/2 after:h-1 after:bg-white dark:after:bg-neutral-700 before:z-20"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="py-2 space-y-1.5">
                      <a
                        href="#"
                        role="menuitem"
                        className="p-2 flex text-gray-700 items-center text-sm hover:bg-purple-50 rounded-md focus:bg-purple-100 dark:text-gray-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 focus:outline-none"
                      >
                        Dashboard
                      </a>

                      <a
                        href="#"
                        role="menuitem"
                        className="p-2 flex text-gray-700 items-center text-sm hover:bg-purple-50 rounded-md focus:bg-purple-100 dark:text-gray-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 focus:outline-none"
                      >
                        Integrations
                      </a>

                      <a
                        href="#"
                        role="menuitem"
                        className="p-2 flex text-gray-700 items-center text-sm hover:bg-purple-50 rounded-md focus:bg-purple-100 dark:text-gray-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 focus:outline-none"
                      >
                        Support
                      </a>
                    </div>
                  </div>
                </div>
              </li>

              <li>
                <a
                  href="#"
                  className="font-medium py-2 block rounded-md focus:outline-none focus:text-indigo-200 hover:text-indigo-200"
                >
                  Pricing
                </a>
              </li>
              <li>
                {' '}
                <a
                  href="#"
                  className="font-medium py-2 block rounded-md focus:outline-none focus:text-indigo-200 hover:text-indigo-200"
                >
                  Contact
                </a>
              </li>

              <li>
                {' '}
                <a
                  href="#"
                  className="font-medium py-2 block rounded-md focus:outline-none focus:text-indigo-200 hover:text-indigo-200"
                >
                  About Us
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      {/* ========== END HEADER ========== */}
    </>
  );
}