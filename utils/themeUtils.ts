import { Theme } from '@/contexts/ThemeContext'

export function getButtonClasses(theme: Theme, variant: 'primary' | 'secondary' = 'secondary') {
  const base = 'flex items-center justify-center transition-all'
  
  if (theme.name === 'neomorphic') {
    return `${base} rounded-soft ${
      variant === 'primary'
        ? 'bg-accent-green text-white'
        : 'bg-soft-bg text-soft-dark hover:shadow-inner-soft'
    }`
  }
  
  return `${base} rounded-full ${
    variant === 'primary'
      ? 'bg-accent-green text-white'
      : 'bg-white text-gray-700 hover:bg-gray-50'
  }`
}

export function getCheckboxClasses(theme: Theme, state: 'completed' | 'skipped' | 'empty', disabled: boolean = false) {
  const base = 'flex items-center justify-center transition-all duration-200'
  const size = 'w-8 h-8 sm:w-10 sm:h-10'
  
  if (theme.name === 'glass') {
    let stateClasses = ''
    if (state === 'completed') {
      stateClasses = 'bg-accent-green backdrop-blur-md'
    } else if (state === 'skipped') {
      stateClasses = 'bg-gray-300/70 backdrop-blur-md'
    } else {
      stateClasses = 'bg-white/40 backdrop-blur-md border border-white/60 hover:bg-white/60'
    }
    
    return `${base} ${size} rounded-2xl ${stateClasses} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`
  }
  
  if (theme.name === 'neomorphic') {
    let stateClasses = ''
    if (state === 'completed') {
      stateClasses = 'bg-accent-green shadow-inner-soft'
    } else if (state === 'skipped') {
      stateClasses = 'bg-soft-light shadow-inner-soft'
    } else {
      stateClasses = 'bg-soft-bg shadow-soft hover:shadow-inner-soft'
    }
    
    return `${base} ${size} rounded-soft ${stateClasses} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`
  }
  
  let stateClasses = ''
  if (state === 'completed') {
    stateClasses = 'bg-accent-green'
  } else if (state === 'skipped') {
    stateClasses = 'bg-gray-100'
  } else {
    stateClasses = 'border-2 border-gray-200 hover:border-gray-300'
  }
  
  return `${base} w-5 h-5 sm:w-6 sm:h-6 rounded ${stateClasses} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`
}

export function getNavigationButtonClasses(theme: Theme) {
  if (theme.name === 'glass') {
    return 'h-12 w-12 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 flex items-center justify-center text-gray-700 hover:bg-white/60 transition-all'
  }
  
  if (theme.name === 'neomorphic') {
    return 'h-12 w-12 rounded-soft bg-soft-bg shadow-soft flex items-center justify-center text-soft-dark hover:shadow-inner-soft transition-all'
  }
  
  return 'h-8 w-8 p-0 rounded-lg bg-white shadow-sm text-gray-700 hover:bg-gray-100 transition-colors'
}

export function getFloatingButtonClasses(theme: Theme, isActive: boolean = false) {
  const size = 'w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12'
  
  if (theme.name === 'glass') {
    return `${size} rounded-2xl flex items-center justify-center transition-all duration-200 backdrop-blur-md border border-white/60 ${
      isActive
        ? 'bg-accent-green text-white'
        : 'bg-white/40 text-gray-700 hover:bg-white/60'
    }`
  }
  
  if (theme.name === 'neomorphic') {
    return `${size} rounded-soft flex items-center justify-center transition-all duration-200 ${
      isActive
        ? 'bg-accent-green text-white shadow-soft'
        : 'bg-soft-bg text-soft-dark shadow-soft hover:shadow-inner-soft'
    }`
  }
  
  return `${size} rounded-full shadow-lg flex items-center justify-center transition-colors duration-200 ${
    isActive
      ? 'bg-accent-green text-white'
      : 'bg-white text-gray-600 hover:bg-gray-50'
  }`
}

export function getProgressBarClasses(theme: Theme) {
  if (theme.name === 'glass') {
    return {
      container: 'h-4 rounded-full bg-white/40 backdrop-blur-md border border-white/60',
      fill: 'h-full rounded-full bg-gradient-to-r from-blue to-accent-green transition-all duration-300 ease-in-out'
    }
  }
  
  if (theme.name === 'neomorphic') {
    return {
      container: 'h-4 rounded-soft bg-soft-bg shadow-inner-soft',
      fill: 'h-full rounded-soft bg-gradient-to-r from-blue to-accent-green transition-all duration-300 ease-in-out'
    }
  }
  
  return {
    container: 'h-4 rounded-full bg-white shadow-sm',
    fill: 'h-full rounded-full bg-gradient-to-r from-blue to-accent-green transition-all duration-300 ease-in-out'
  }
}

export function getTextClasses(theme: Theme, variant: 'primary' | 'secondary' | 'muted' = 'primary') {
  if (theme.name === 'glass') {
    const colors = {
      primary: 'text-gray-800',
      secondary: 'text-gray-700',
      muted: 'text-gray-600'
    }
    return `${colors[variant]} font-light`
  }
  
  if (theme.name === 'neomorphic') {
    const weights = {
      primary: 'font-light',
      secondary: 'font-light',
      muted: 'font-light'
    }
    const colors = {
      primary: 'text-soft-dark',
      secondary: 'text-soft-dark',
      muted: 'text-soft-mid'
    }
    return `${colors[variant]} ${weights[variant]}`
  }
  
  const colors = {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    muted: 'text-gray-500'
  }
  return colors[variant]
}

export function getHeadingClasses(theme: Theme) {
  if (theme.name === 'glass') {
    return 'text-gray-800 font-medium'
  }
  
  if (theme.name === 'neomorphic') {
    return 'text-soft-dark font-medium font-display'
  }
  
  return 'text-gray-900 font-bold'
}
