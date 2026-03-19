import { auth } from "@/auth";



export default async function Home() {

  const session = await auth()
  return (
    <div>
      {session ? (
        <div>
          <p>Welcome, {session.user?.name}!</p>
        </div>
      ) : (
        <div>
          <p>Please sign in to view your profile.</p>
        </div>
      )}
    </div>
  )
}