import './env'
import { nextTick } from '@vue/runtime-core'
import PromisePolyfill from 'promise-polyfill'

describe('scheduler', () => {
  it('nextTick', async () => {
    const calls: string[] = []
    const dummyThen = PromisePolyfill.resolve().then()
    const job1 = () => {
      calls.push('job1')
    }
    const job2 = () => {
      calls.push('job2')
    }
    nextTick(job1)
    job2()

    expect(calls.length).toBe(1)
    await dummyThen
    // job1 will be pushed in nextTick
    expect(calls.length).toBe(2)
    expect(calls).toMatchObject(['job2', 'job1'])
  })

  it('nextTick should return promise polyfill', async () => {
    const fn = vi.fn(() => {
      return 1
    })

    const p = nextTick(fn)

    expect(p).toBeInstanceOf(PromisePolyfill)
    expect(await p).toBe(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
