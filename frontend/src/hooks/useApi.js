import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'

export const useApi = (apiFn, options = {}) => {
  const [data,    setData]    = useState(options.initialData ?? null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn(...args)
      const result = res.data?.data ?? res.data
      setData(result)
      if (options.successMsg) toast.success(options.successMsg)
      options.onSuccess?.(result)
      return result
    } catch (err) {
      const msg = err.response?.data?.message || 'সমস্যা হয়েছে।'
      setError(msg)
      options.onError?.(err)
      return null
    } finally {
      setLoading(false)
    }
  }, [apiFn])

  return { data, loading, error, execute, setData }
}

export const useDownload = () => {
  const [loading, setLoading] = useState(false)

  const download = async (apiFn, params, filename) => {
    setLoading(true)
    try {
      const res = await apiFn(params)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${filename} ডাউনলোড শুরু হয়েছে।`)
    } catch {
      toast.error('ডাউনলোড করতে সমস্যা হয়েছে।')
    } finally {
      setLoading(false)
    }
  }

  return { download, loading }
}
