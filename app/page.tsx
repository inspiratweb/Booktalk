import BookTalkApp from "@/components/BookTalkApp";
import { BookTalkProvider } from "@/components/BookTalkContext";

export default function Home() {
  return (
    <BookTalkProvider>
      <BookTalkApp />
    </BookTalkProvider>
  );
}
