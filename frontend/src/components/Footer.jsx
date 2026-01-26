import { motion } from 'framer-motion'

const Footer = () => {
  return (
    <footer className="w-full py-8 border-t border-slate-200 bg-white">
      <div className="container mx-auto px-4 text-center text-slate-500">
        <p className="font-medium">
          &copy; {new Date().getFullYear()} WorkShop. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer