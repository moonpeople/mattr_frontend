const ui = require('./ui.config.js')
const deepMerge = require('deepmerge')
const plugin = require('tailwindcss/plugin')

const color = require('./../ui/build/css/tw-extend/color')

/**
 *
 */
let colorExtend = {}
Object.values(color).map((x, i) => {
  colorExtend[Object.keys(color)[i]] = `hsl(${x.cssVariable} / <alpha-value>)` // x.cssVariable
})

const appSpacing = {
  '0.5': 'var(--app-space-0-5, 0.125rem)',
  '1': 'var(--app-space-1, 0.25rem)',
  '1.5': 'var(--app-space-1-5, 0.375rem)',
  '2': 'var(--app-space-2, 0.5rem)',
  '2.5': 'var(--app-space-2-5, 0.625rem)',
  '3': 'var(--app-space-3, 0.75rem)',
  '3.5': 'var(--app-space-3-5, 0.875rem)',
  '4': 'var(--app-space-4, 1rem)',
  '5': 'var(--app-space-5, 1.25rem)',
  '6': 'var(--app-space-6, 1.5rem)',
  '7': 'var(--app-space-7, 1.75rem)',
  '8': 'var(--app-space-8, 2rem)',
  '9': 'var(--app-space-9, 2.25rem)',
  '10': 'var(--app-space-10, 2.5rem)',
  '11': 'var(--app-space-11, 2.75rem)',
  '12': 'var(--app-space-12, 3rem)',
  '14': 'var(--app-space-14, 3.5rem)',
  '16': 'var(--app-space-16, 4rem)',
  '20': 'var(--app-space-20, 5rem)',
  '24': 'var(--app-space-24, 6rem)',
  '28': 'var(--app-space-28, 7rem)',
  '32': 'var(--app-space-32, 8rem)',
  '36': 'var(--app-space-36, 9rem)',
  '40': 'var(--app-space-40, 10rem)',
  '44': 'var(--app-space-44, 11rem)',
  '48': 'var(--app-space-48, 12rem)',
  '52': 'var(--app-space-52, 13rem)',
  '56': 'var(--app-space-56, 14rem)',
  '60': 'var(--app-space-60, 15rem)',
  '64': 'var(--app-space-64, 16rem)',
  '72': 'var(--app-space-72, 18rem)',
  '80': 'var(--app-space-80, 20rem)',
  '96': 'var(--app-space-96, 24rem)',
}

// console.log('colorExtend', colorExtend)
// console.log('colorExtend kebabToNested', kebabToNested(colorExtend))

// console.log('colorExtend', kebabToNested(colorExtend).colors.gray)

/**
 * Generates Tailwind colors for the theme
 * adds <alpha-value> as part of the hsl value
 */
function generateTwColorClasses(globalKey, twAttributes) {
  let classes = {}
  Object.values(twAttributes).map((attr, i) => {
    const attrKey = Object.keys(twAttributes)[i]

    if (attrKey.includes(globalKey)) {
      const keySplit = attrKey.split('-').splice(1).join('-')

      let payload = {
        [keySplit]: `hsl(${attr.cssVariable} / <alpha-value>)`,
      }

      if (keySplit == 'DEFAULT') {
        // includes a 'default' duplicate
        // this allows for classes like `border-default` which is the same as `border`
        payload = {
          ...payload,
          default: `hsl(${attr.cssVariable} / <alpha-value>)`,
        }
      }

      classes = {
        ...classes,
        ...payload,
      }
    }
  })
  /**
   * mutate object into nested object for tailwind theme structure
   */
  const nestedClasses = kebabToNested(classes)
  // return, but nest the keys if they are kebab case named
  return nestedClasses
}

/**
 * Helper to convert kebab named keys in object to nested nodes
 */
function kebabToNested(obj) {
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('-')
    let currentObj = result
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i] === 'DEFAULT' ? parts[i] : parts[i].toLowerCase() // convert key to lowercase
      if (!currentObj[part]) {
        currentObj[part] = {}
      }
      if (i === parts.length - 1) {
        if (typeof value === 'object') {
          currentObj[part] = kebabToNested(value) // recursively convert nested objects
        } else {
          currentObj[part] = value.toString().toLowerCase() // convert value to lowercase
        }
      } else {
        currentObj = currentObj[part]
      }
    }
  }
  return result
}

/**
 * Main theme config
 */
const uiConfig = ui({
  mode: 'JIT',
  darkMode: ['class', '[data-theme*="dark"]'],
  theme: {
    /**
     * Spread all theme colors and custom generated colors into theme
     */
    textColor: (theme) => ({
      ...theme('colors'),
      ...generateTwColorClasses('foreground', color),
    }),
    backgroundColor: (theme) => ({
      ...theme('colors'),
      ...generateTwColorClasses('background', color),
      /*
       * custom background re-maps
       */
      studio: `hsl(var(--background-200)/ <alpha-value>)`,
    }),
    borderColor: (theme) => ({
      ...theme('colors'),
      ...generateTwColorClasses('border', color),
    }),
    extend: {
      colors: {
        ...kebabToNested(colorExtend),
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },

      typography: ({ theme }) => ({
        // Removal of backticks in code blocks for tailwind v3.0
        // https://github.com/tailwindlabs/tailwindcss-typography/issues/135
        DEFAULT: {
          css: {
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            '--tw-prose-body': 'hsl(var(--foreground-light))',
            '--tw-prose-headings': 'hsl(var(--foreground-default))',
            '--tw-prose-lead': 'hsl(var(--foreground-light))',
            '--tw-prose-links': 'hsl(var(--foreground-light))',
            '--tw-prose-bold': 'hsl(var(--foreground-light))',
            '--tw-prose-counters': 'hsl(var(--foreground-light))',
            '--tw-prose-bullets': 'hsl(var(--foreground-muted))',
            '--tw-prose-hr': 'hsl(var(--background-surface-300))',
            '--tw-prose-quotes': 'hsl(var(--foreground-light))',
            '--tw-prose-quote-borders': 'hsl(var(--background-surface-300))',
            '--tw-prose-captions': 'hsl(var(--border-strong))',
            '--tw-prose-code': 'hsl(var(--foreground-default))',
            '--tw-prose-pre-code': 'hsl(var(--foreground-muted))',
            '--tw-prose-pre-bg': 'hsl(var(--background-surface-200))',
            '--tw-prose-th-borders': 'hsl(var(--background-surface-300))',
            '--tw-prose-td-borders': 'hsl(var(--background-default))',
            '--tw-prose-invert-body': 'hsl(var(--background-default))',
            '--tw-prose-invert-headings': theme('colors.white'),
            '--tw-prose-invert-lead': 'hsl(var(--background-surface-300))',
            '--tw-prose-invert-links': theme('colors.white'),
            '--tw-prose-invert-bold': theme('colors.white'),
            '--tw-prose-invert-counters': 'hsl(var(--background-surface-200))',
            '--tw-prose-invert-bullets': 'hsl(var(--background-selection))',
            '--tw-prose-invert-hr': 'hsl(var(--border-strong))',
            '--tw-prose-invert-quotes': 'hsl(var(--background-alternative-default))',
            '--tw-prose-invert-quote-borders': 'hsl(var(--border-strong))',
            '--tw-prose-invert-captions': 'hsl(var(--background-surface-200))',
            // the following are typography overrides
            // examples can be seen here —> https://github.com/tailwindlabs/tailwindcss-typography/blob/master/src/styles.js
            // reset all header font weights
            h4: {
              // override font size
              fontSize: '1.15em',
            },
            h5: {
              // h5 not included in --tw-prose-headings
              color: theme('colors.scale[1200]'),
            },
            'h1, h2, h3, h4, h5, h6': {
              fontWeight: '400',
            },
            'article h2, article h3, article h4, article h5, article h6': {
              marginTop: '2em',
              marginBottom: '1em',
            },
            p: {
              fontWeight: '400',
            },
            pre: {
              background: 'none',
              padding: 0,
              marginBottom: '32px',
            },
            ul: {
              listStyleType: 'none',
              paddingLeft: '1rem',
            },
            'ul li': {
              position: 'relative',
            },
            'ul li::before': {
              position: 'absolute',
              top: '0.75rem',
              left: '-1rem',
              height: '0.125rem',
              width: '0.5rem',
              borderRadius: '0.25rem',
              backgroundColor: 'hsl(var(--border-strong))',
              content: '""',
            },
            ol: {
              paddingLeft: '1rem',
              counterReset: 'item',
              listStyleType: 'none',
              marginBottom: '3rem',
            },
            'ol>li': {
              display: 'block',
              position: 'relative',
              paddingLeft: '1rem',
            },
            'ol>li::before': {
              position: 'absolute',
              top: '0.25rem',
              left: '-1rem',
              height: '1.2rem',
              width: '1.2rem',
              borderRadius: '0.25rem',
              backgroundColor: 'hsl(var(--background-surface-100))',
              border: '1px solid hsl(var(--border-default))',
              content: 'counter(item) "  "',
              counterIncrement: 'item',
              fontSize: '12px',
              color: 'hsl(var(--foreground-muted))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },

            'p img': {
              border: '1px solid hsl(var(--border-muted))',
              borderRadius: '4px',
              overflow: 'hidden',
            },
            iframe: {
              border: '1px solid ' + theme('borderColor.DEFAULT'),
              borderRadius: theme('borderRadius.lg'),
            },
            td: {
              borderBottom: '1px solid ' + 'hsl(var(--background-surface-200))',
            },
            code: {
              fontWeight: '400',
              padding: '0.2rem 0.4rem',
              backgroundColor: 'hsl(var(--background-surface-200))',
              border: '1px solid ' + 'hsl(var(--background-surface-300))',
              borderRadius: theme('borderRadius.lg'),
            },
            a: {
              position: 'relative',
              transition: 'all 0.18s ease',
              paddingBottom: '2px',
              fontWeight: '400',
              opacity: 1,
              color: 'hsl(var(--foreground-default))',
              textDecorationLine: 'underline',
              textDecorationColor: 'hsl(var(--foreground-muted))',
              textDecorationThickness: '1px',
              textUnderlineOffset: '2px',
            },
            'a:hover': {
              textDecorationColor: 'hsl(var(--foreground-default))',
            },
            figcaption: {
              color: 'hsl(var(--foreground-muted))',
              fontFamily: 'Office Code Pro, monospace',
            },
            'figure.quote-figure p:first-child': {
              marginTop: '0 !important',
            },
            'figure.quote-figure p:last-child': {
              marginBottom: '0 !important',
            },
            figure: {
              margin: '3rem 0',
            },
            'figure img': {
              margin: '0 !important',
            },
          },
        },

        toc: {
          css: {
            ul: {
              'list-style-type': 'none',
              'padding-left': 0,
              margin: 0,
              li: {
                'padding-left': 0,
              },
              a: {
                display: 'block',
                marginBottom: '0.4rem',
                'text-decoration': 'none',
                fontSize: '0.8rem',
                fontWeight: '200',
                color: 'hsl(var(--foreground-light))',
                '&:hover': {
                  color: 'hsl(var(--foreground-default))',
                },
                'font-weight': '400',
              },
              // margin: 0,
              ul: {
                'list-style-type': 'none',
                li: {
                  marginTop: '0.2rem',
                  marginBottom: '0.2rem',
                  'padding-left': '0 !important',
                  'margin-left': '0.5rem',
                },
                a: {
                  fontWeight: '200',
                  color: 'hsl(var(--foreground-lighter))',
                  '&:hover': {
                    color: 'hsl(var(--foreground-default))',
                  },
                },
              },
            },
          },
        },
        // used in auto docs
        docs: {
          css: {
            '--tw-prose-body': 'hsl(var(--foreground-light))',
            '--tw-prose-headings': 'hsl(var(--foreground-default))',
            '--tw-prose-lead': 'hsl(var(--foreground-light))',
            '--tw-prose-links': 'hsl(var(--brand-500))',
            '--tw-prose-bold': 'hsl(var(--foreground-light))',
            '--tw-prose-counters': 'hsl(var(--foreground-light))',
            '--tw-prose-bullets': 'hsl(var(--foreground-muted))',
            '--tw-prose-hr': 'hsl(var(--background-surface-300))',
            '--tw-prose-quotes': 'hsl(var(--foreground-light))',
            '--tw-prose-quote-borders': 'hsl(var(--background-surface-300))',
            '--tw-prose-captions': 'hsl(var(--border-strong))',
            '--tw-prose-code': 'hsl(var(--foreground-default))',
            '--tw-prose-pre-code': 'hsl(var(--foreground-muted))',
            '--tw-prose-pre-bg': 'hsl(var(--background-surface-200))',
            '--tw-prose-th-borders': 'hsl(var(--background-surface-300))',
            '--tw-prose-td-borders': 'hsl(var(--background-default))',
            '--tw-prose-invert-body': 'hsl(var(--background-default))',
            '--tw-prose-invert-headings': theme('colors.white'),
            '--tw-prose-invert-lead': 'hsl(var(--background-surface-300))',
            '--tw-prose-invert-links': theme('colors.white'),
            '--tw-prose-invert-bold': theme('colors.white'),
            '--tw-prose-invert-counters': 'hsl(var(--background-surface-200))',
            '--tw-prose-invert-bullets': 'hsl(var(--background-selection))',
            '--tw-prose-invert-hr': 'hsl(var(--border-strong))',
            '--tw-prose-invert-quotes': 'hsl(var(--background-alternative-default))',
            '--tw-prose-invert-quote-borders': 'hsl(var(--border-strong))',
            '--tw-prose-invert-captions': 'hsl(var(--background-surface-200))',
            // the following are typography overrides
            // examples can be seen here —> https://github.com/tailwindlabs/tailwindcss-typography/blob/master/src/styles.js
            // reset all header font weights
            'h1, h2, h3, h4, h5': {
              fontWeight: '400',
            },
          },
        },
      }),
      screens: {
        xs: '480px',
      },
      fontFamily: {
        sans: 'var(--font-custom, Circular, custom-font, Helvetica Neue, Helvetica, Arial, sans-serif)',
        mono: 'var(--font-source-code-pro, Source Code Pro, Office Code Pro, Menlo, monospace)',
      },

      // shadcn defaults START
      keyframes: {
        'flash-code': {
          '0%': { backgroundColor: 'rgba(63, 207, 142, 0.1)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'collapsible-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'flash-code': 'flash-code 1s forwards',
        'flash-code-slow': 'flash-code 2s forwards',
        'accordion-down': 'accordion-down 0.15s ease-out',
        'accordion-up': 'accordion-up 0.15s ease-out',
        'collapsible-down': 'collapsible-down 0.10s ease-out',
        'collapsible-up': 'collapsible-up 0.10s ease-out',
      },
      spacing: {
        ...appSpacing,
      },
      borderRadius: {
        sm: 'var(--app-radius-sm, 0.125rem)',
        DEFAULT: 'var(--app-radius-md, 0.25rem)',
        md: 'var(--app-radius-md, 0.375rem)',
        lg: 'var(--app-radius-lg, 0.5rem)',
        xl: 'var(--app-radius-xl, 0.75rem)',
        '2xl': 'var(--app-radius-xl, 1rem)',
        '3xl': 'var(--app-radius-xl, 1.5rem)',
        panel: '6px',
      },
      boxShadow: {
        xs: 'var(--app-shadow-xs, 0 1px 1px 0 rgb(0 0 0 / 0.05))',
        sm: 'var(--app-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05))',
        md: 'var(--app-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1))',
        lg: 'var(--app-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1))',
      },
      padding: {
        content: '21px',
      },
      // borderRadius: {
      //   lg: `var(--radius)`,
      //   md: `calc(var(--radius) - 2px)`,
      //   sm: 'calc(var(--radius) - 4px)',
      // },
      // fontFamily: {
      //   sans: ['var(--font-sans)', ...fontFamily.sans],
      // },
      // shadcn defaults END
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
    plugin(motionSafeTransition),
    function ({ addVariant }) {
      addVariant('not-disabled', '&:not(:disabled)')
    },
  ],
})

/**
 * Plugin to add `safe` versions of the `transition-*` properties, which respect
 * `prefers-reduced-motion`.
 *
 * When users prefer reduced motion, the duration of transform transitions is
 * reduced to something negiglible (1ms). The original `transition-*` properties
 * aren't overridden to provide flexibility, in situations where you want to
 * handle the `prefers-reduced-motion` case some other way.
 *
 * See https://css-tricks.com/levels-of-fix/.
 *
 * Usage: <div className="transition-safe duration-safe-100">
 *        - Transitioned properties will animate with duration 100, _except_
 *          transform properties when prefers-reduced-motion is on, which
 *          will animate instantaneously.
 *
 * Note:
 *   - `duration-safe` must be used with `transition-safe`
 *   - Non-safe `duration` must be used with non-safe `transition`
 *   - (Cannot be mixed)
 */
function motionSafeTransition({ addUtilities, matchUtilities, theme }) {
  addUtilities({
    '.transition-safe': {
      transitionProperty:
        'color, transform, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, filter, backdrop-filter',
      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDuration: '150ms',
      '@media (prefers-reduced-motion)': {
        transitionDuration:
          '150ms, 1ms, 150ms, 150ms, 150ms, 150ms, 150ms, 150ms, 150ms, 150s, 150ms',
      },
    },
    '.transition-safe-all': {
      transitionProperty: 'all, transform',
      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDuration: '150ms',
      '@media (prefers-reduced-motion)': {
        transitionDuration: '150ms, 1ms',
      },
    },
    '.transition-safe-transform': {
      /**
       * The duplicate `transform` here is a hacky way of dealing with the fact
       * that `transform` must be second in `transition-safe-all` to override
       * `all`, and its order must be the same across all `transition-safe-*`
       * classes, so the proper duration applies in `duration-safe`.
       */
      transitionProperty: 'transform, transform',
      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDuration: '150ms',
      '@media (prefers-reduced-motion)': {
        transitionDuration: '1ms',
      },
    },
    /* Hide scrollbar for Chrome, Safari and Opera */
    '.no-scrollbar::-webkit-scrollbar': {
      display: 'none',
    },
    /* Hide scrollbar for IE, Edge and Firefox */
    '.no-scrollbar': {
      '-ms-overflow-style': 'none' /* IE and Edge */,
      'scrollbar-width': 'none' /* Firefox */,
    },
  })

  matchUtilities(
    {
      'duration-safe': (value) => ({
        transitionDuration: value,
        '@media (prefers-reduced-motion)': {
          /**
           * Preserves the indicated duration for everything except `transform`.
           *
           * Relies on browsers truncating the `transition-duration` property
           * if there are more values than there are transitioned properties.
           */
          transitionDuration: `${value}, 1ms, ${value}, ${value}, ${value}, ${value}, ${value}, ${value}, ${value}, ${value}, ${value}`,
        },
      }),
    },
    { values: theme('transitionDuration') }
  )
}

function arrayMergeFn(destinationArray, sourceArray) {
  return destinationArray.concat(sourceArray).reduce((acc, cur) => {
    if (acc.includes(cur)) return acc
    return [...acc, cur]
  }, [])
}

/**
 * Merge Supabase UI and Tailwind CSS configurations
 * @param {object} tailwindConfig - Tailwind config object
 * @return {object} new config object
 */
function wrapper(tailwindConfig) {
  return deepMerge({ ...tailwindConfig }, uiConfig, {
    arrayMerge: arrayMergeFn,
  })
}

module.exports = wrapper
