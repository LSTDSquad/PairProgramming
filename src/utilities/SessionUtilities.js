import React from "react";

const tipToJSX = ({ English, Turkish, Czech }) => {
  const blurbToJSX = str => {
    const lines = str.split("\n");
    return (
      <div>
        {lines.map((line, i) => {
          return i === 0 ? <h5>{line}</h5> : <div key={i}>{line}</div>;
        })}
      </div>
    );
  };

  return (
    <div>
      {blurbToJSX(English)}
      {blurbToJSX(Turkish)}
      {blurbToJSX(Czech)}
    </div>
  );
};

const RemindingTipMessages = {
  0: tipToJSX({
    English: `Remember to switch roles about every 10 minutes 
        Both partners should get a chance to be pilot and co-pilot`,
    Turkish: `Her 10 dakikada bir rol değiştirmeyi unutmayın
    Her iki (ortak da (partner de) pilot ve yardımcı pilot olma şansına sahip olmalı`,
    Czech: `Nezapomeňte přepínat role každých 10 minut
    Oba partneři by měli dostat šanci být “pilotem” a “spolu-pilotem”`
  }),
  1: tipToJSX({
    English: `Partners that have the most success communicate a lot 
        Be supportive of one another
        Be respectful `,
    Turkish: `En başarılı ( olan ortaklar (partnerler) çok iletişim kurar
        Birbirinize destek olun
        Saygılı ol(un) `,
        
    Czech: `Partneři, kteří mezi sebou často komunikují, mají největší úspěch
    Podporujte jeden druhého
    Buďte uctiví`
  }),

  2: tipToJSX({
    English: `Listening is important for success!
  Listen to understand your partner’s questions.
  Ask questions that help improve your understanding.`,
    Turkish: `Başarı için dinlemek önemlidir!
  Eşinizin (partnerinizin) sorularını anlamak için dinleyin.
  Anlayışınızı geliştirmenize yardımcı olacak sorular sorun.`,
    Czech: `Poslech je důležitý pro úspěch!
    Poslouchejte, abyste porozuměli otázkám svého partnera.
    Zeptejte se na to, co vám není jasné.`
  }),
  3: tipToJSX({
    English: `Asking questions helps you learn more!
    Questions help both partners learn more.
    Be clear when when (remove extra when) describing a problem or confusion`,
    Turkish: `Soru sormak daha fazla öğrenmenize yardımcı olur!
    Sorular her iki ortağın da daha fazla bilgi edinmesine yardımcı olur.
    Bir sorunu veya karışıklığı açıklarken net olun`,
    Czech: ` Čím víc se ptáte, tím víc se učíte
    Otázky pomáhají oběma partnerům lépe se učít.
    Při popisu problému/Pokud jste s něčím zmateni, buďte co nejjasnější`
  }),
  4: tipToJSX({
    English: `Be patient with one another and be supportive
  Pair programming can feel slow at times.
  Allow for misunderstanding`,
    Turkish: `Birbirinize karşı sabırlı olun ve destekleyici olun
  Eş programlama (I'd check if it's how they refer to it in turkish ) bazen yavaş olabilir.
  Yanlış anlaşılmaya izin ver (be tolerant-tolerans goster - more true to meaning - )`,
    Czech: `Buďte trpěliví a buďte podporující
    Párové programování se může občas cítit pomalu.
    Počítejte s nedorozuměním`
  }),

  5: tipToJSX({
    English: `Both partners should understand every line of code! 
  Remember to switch roles often
  You have been working for an hour -- maybe take a short break?`,
    Turkish: `Her iki (ortak da (partner de) her kod satırını anlamalıdır! 
  Rolleri sık sık değiştirmeyi unutmayın
  Bir saattir çalışıyorsun - belki kısa bir ara verirsin?`,
    Czech: `Oba partneři by měli rozumět každému řádku kódu!
    Nezapomeňte často měnit role`
  })
};

export { RemindingTipMessages };
