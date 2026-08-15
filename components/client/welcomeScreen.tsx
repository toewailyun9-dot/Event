export default function WelcomeScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md mx-auto p-8 bg-card rounded-xl shadow-lg border border-border text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-3xl">
          🎉
        </div>
        <h1 className="text-xl font-bold text-foreground">
          မင်္ဂလာပါ
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          လက်ရှိတွင် စာရင်းသွင်းနိုင်သည့် Event မရှိသေးပါ။
          Event စတင်သည့်အခါ ဤနေရာတွင် ဖော်ပြပေးပါမည်။
        </p>
      </div>
    </div>
  );
}