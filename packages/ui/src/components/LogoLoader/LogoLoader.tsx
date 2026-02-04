import styles from './loading-anim.module.css'

const LogoLoader = () => (
  <div className="w-full h-full flex flex-col items-center justify-center">
    <div>
      <svg
        width="60"
        height="62"
        viewBox="0 0 109 113"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles['loading']}
        aria-hidden="true"
      >
        <path
          d="M3.5,88.5v-1.1h5.2c1.3,0,2.3-0.2,3.1-0.7c0.8-0.5,1.6-1.4,2.5-2.6c0.8-1.3,1.7-3,2.9-5l26.7-54.5h23.5L98.5,82 c1,1.9,2.1,3.4,3.1,4.2s2.3,1.1,3.9,1.1v1.1h-44v-1.1c3.1,0,5.2-0.2,6.4-0.6c1.3-0.3,1.8-1.4,1.8-2.9 c0-0.7-0.1-1.4-0.3-2.2c-0.2-0.8-0.6-1.7-1-2.6l-11.5-23h-3.4v32.4H33.5V56.1h-3.7l-10.6,22c-0.6,1.1-1,2.2-1.3,3.1 c-0.3,0.9-0.5,1.8-0.5,2.5c0,1.4,0.8,2.3,2.3,2.9s4.3,0.8,8.2,0.8v1.1C28,88.5,3.5,88.5,3.5,88.5z M30.7,55h25.6 l-8.8-17.6c-0.5-0.9-0.9-1.9-1.5-2.9c-0.5-0.9-0.9-1.8-1.4-2.9c-0.5-1-0.9-2.1-1.4-3.1c-0.3,1-0.8,2.1-1.3,3.1 c-0.5,1-0.9,1.9-1.4,2.9c-0.5,0.9-0.9,1.8-1.4,2.9L30.7,55z"
          fill="#FED000"
        />
      </svg>
    </div>
  </div>
)

export default LogoLoader
