import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/Avatar'

interface TaskRow {
  id: string
  title: string
  status: string
  customer: { id: string; full_name: string; avatar_url: string | null } | null
  courier: { id: string; full_name: string; avatar_url: string | null } | null
}

interface MsgRow {
  task_id: string
  content: string
  created_at: string
  sender_id: string
  is_read: boolean
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: rawTasks } = await supabase
    .from('tasks')
    .select(
      `id, title, status,
       customer:profiles!tasks_customer_id_fkey(id, full_name, avatar_url),
       courier:profiles!tasks_courier_id_fkey(id, full_name, avatar_url)`
    )
    .or(`customer_id.eq.${user.id},courier_id.eq.${user.id}`)
    .not('courier_id', 'is', null)
    .order('updated_at', { ascending: false })

  const tasks = (rawTasks ?? []) as unknown as TaskRow[]
  const taskIds = tasks.map((t) => t.id)

  let lastMessages: MsgRow[] = []
  if (taskIds.length > 0) {
    const { data } = await supabase
      .from('messages')
      .select('task_id, content, created_at, sender_id, is_read')
      .in('task_id', taskIds)
      .order('created_at', { ascending: false })
    lastMessages = (data ?? []) as MsgRow[]
  }

  const lastMsgMap = new Map<string, MsgRow>()
  for (const msg of lastMessages) {
    if (!lastMsgMap.has(msg.task_id)) {
      lastMsgMap.set(msg.task_id, msg)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 56px)',
        flexDirection: 'column',
        maxWidth: 800,
        margin: '0 auto',
        padding: '24px 24px 0',
      }}
    >
      <h2 className="text-xl font-bold mb-5">Сообщения</h2>

      {tasks.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: '#c5c5d3' }}>
            chat_bubble
          </span>
          <p className="font-bold mt-3" style={{ color: '#757682' }}>Нет переписок</p>
          <p className="text-sm mt-1" style={{ color: '#c5c5d3' }}>
            Чаты открываются автоматически, когда курьер принимает поручение
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => {
            const lastMsg = lastMsgMap.get(task.id)
            const partner = task.customer?.id === user.id ? task.courier : task.customer
            if (!partner) return null
            const unread = lastMsg && !lastMsg.is_read && lastMsg.sender_id !== user.id

            return (
              <Link
                key={task.id}
                href={`/messages/${task.id}`}
                className="flex items-center gap-3 p-4 rounded-2xl hover:bg-white transition-colors cursor-pointer"
                style={{
                  background: unread ? '#f0f4ff' : '#fff',
                  border: '1px solid #eceef0',
                }}
              >
                <Avatar name={partner.full_name ?? '?'} avatarUrl={partner.avatar_url} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-sm truncate">{partner.full_name}</p>
                    {lastMsg && (
                      <p className="text-xs flex-shrink-0 ml-2" style={{ color: '#c5c5d3' }}>
                        {new Date(lastMsg.created_at).toLocaleTimeString('ru', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: '#757682' }}>
                    {task.title}
                  </p>
                  {lastMsg && (
                    <p
                      className="text-xs truncate mt-0.5"
                      style={{
                        color: unread ? '#191c1e' : '#c5c5d3',
                        fontWeight: unread ? 600 : 400,
                      }}
                    >
                      {lastMsg.content}
                    </p>
                  )}
                </div>
                {unread && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 9999,
                      background: '#006c49',
                      flexShrink: 0,
                    }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
