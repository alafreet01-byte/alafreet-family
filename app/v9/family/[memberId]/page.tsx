"use client";

import { useParams, useRouter } from "next/navigation";
import { getFamilyMember } from "../data";

const sections = [
  {
    title: "الذكريات",
    subtitle: "الصور والفيديو واللحظات الجميلة",
    icon: "✦",
  },
  {
    title: "الإنجازات",
    subtitle: "المراحل والنجاحات المميزة",
    icon: "★",
  },
  {
    title: "الرسائل",
    subtitle: "رسائل خاصة ومحفوظة",
    icon: "✉",
  },
  {
    title: "الملفات",
    subtitle: "المستندات والمرفقات",
    icon: "▣",
  },
  {
    title: "الهدايا",
    subtitle: "الهدايا والمفاجآت",
    icon: "◆",
  },
  {
    title: "المواعيد",
    subtitle: "الأحداث والمناسبات القادمة",
    icon: "◷",
  },
];

const timeline = [
  {
    year: "البداية",
    title: "بداية القصة",
    description: "أول محطة محفوظة في عالم هذا الفرد.",
  },
  {
    year: "الذكريات",
    title: "لحظات لا تُنسى",
    description: "الصور والفيديوهات والمواقف العائلية المميزة.",
  },
  {
    year: "اليوم",
    title: "الفصل الحالي",
    description: "آخر الإنجازات والأحداث والتحديثات.",
  },
];

export default function MemberProfilePage() {
  const params = useParams<{ memberId: string }>();
  const router = useRouter();

  const member = getFamilyMember(params.memberId);

  if (!member) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background:
            "radial-gradient(circle at 50% 20%, rgba(255,190,70,0.12), transparent 30%), #02030a",
          color: "#ffffff",
        }}
      >
        <section
          style={{
            width: "min(100%, 520px)",
            padding: 32,
            textAlign: "center",
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(8,10,20,0.82)",
            backdropFilter: "blur(18px)",
          }}
        >
          <div
            style={{
              fontSize: 46,
              marginBottom: 12,
            }}
          >
            ◌
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 28,
            }}
          >
            الملف غير موجود
          </h1>

          <p
            style={{
              margin: "12px 0 22px",
              color: "rgba(255,255,255,0.48)",
            }}
          >
            لم يتم العثور على بيانات هذا الفرد.
          </p>

          <button
            type="button"
            onClick={() => router.push("/v9/family")}
            style={{
              border: "1px solid rgba(255,215,109,0.28)",
              background: "rgba(255,215,109,0.1)",
              color: "#ffe2a0",
              padding: "12px 20px",
              borderRadius: 14,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            العودة إلى عالم العائلة
          </button>
        </section>
      </main>
    );
  }

  const isAisha = member.id === "aisha";
  const isReem = member.id === "reem";
  const isAhmed = member.id === "ahmed";
  const isAmal = member.id === "amal";
  const illustratedBackground = isAisha
    ? "/v9/backgrounds/aisha-garden-v1.png"
    : isReem
      ? "/v9/backgrounds/reem-art-studio-v1.png"
      : isAhmed
        ? "/v9/backgrounds/ahmed-warrior-valley-v1.png"
        : isAmal
          ? "/v9/backgrounds/amal-20th-anniversary-v1.png"
          : "";

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        overflowX: "hidden",
        padding: "28px 20px 60px",
        background: `
          radial-gradient(circle at 82% 8%, ${member.color}24, transparent 25%),
          radial-gradient(circle at 18% 42%, rgba(88,106,255,0.12), transparent 30%),
          linear-gradient(180deg, #02030a 0%, #070914 55%, #010105 100%)
        `,
        color: "#ffffff",
      }}
    >
      <div
        style={{
          width: "min(100%, 1180px)",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => router.push("/v9/family")}
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "#ffffff",
              padding: "11px 16px",
              borderRadius: 14,
              cursor: "pointer",
              backdropFilter: "blur(12px)",
            }}
          >
            ← العودة إلى عالم العائلة
          </button>

          <div
            style={{
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.3em",
                color: "rgba(255,215,109,0.48)",
              }}
            >
              PRIVATE MEMBER UNIVERSE
            </div>

            <div
              style={{
                marginTop: 5,
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: "0.07em",
                color: "#ffe2a0",
              }}
            >
              ALAFREET.AE
            </div>
          </div>
        </header>

        <section
          style={{
            position: "relative",
            marginTop: 26,
            overflow: "hidden",
            borderRadius: 34,
            border: `1px solid ${member.color}35`,
            background: illustratedBackground
              ? `linear-gradient(90deg, rgba(13,7,22,.08) 0%, rgba(13,7,22,.48) 48%, rgba(13,7,22,.92) 100%), url('${illustratedBackground}') center/cover no-repeat`
              : "rgba(5,7,16,0.76)",
            boxShadow: `0 30px 100px ${member.color}0f`,
            backdropFilter: "blur(22px)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: illustratedBackground
                ? "linear-gradient(180deg, rgba(255,255,255,.04), rgba(20,7,28,.15))"
                : `radial-gradient(circle at 85% 10%, ${member.color}1f, transparent 26%), linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.018), transparent 70%)`,
            }}
          />

          <div
            style={{
              position: "relative",
              padding: "34px 30px",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.3fr) minmax(260px, 0.7fr)",
              gap: 26,
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 11px",
                  borderRadius: 999,
                  color: member.color,
                  border: `1px solid ${member.color}35`,
                  background: `${member.color}0d`,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: member.color,
                    boxShadow: `0 0 14px ${member.color}`,
                  }}
                />

                {member.role}
              </div>

              <h1
                style={{
                  margin: "15px 0 0",
                  fontSize: "clamp(42px, 7vw, 82px)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                {member.name}
              </h1>

              <p
                style={{
                  margin: "16px 0 0",
                  maxWidth: 580,
                  color: "rgba(255,255,255,0.48)",
                  fontSize: 16,
                  lineHeight: 1.8,
                }}
              >
                {member.subtitle}
              </p>

              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {["الذكريات", "الإنجازات", "الرسائل"].map((item) => (
                  <span
                    key={item}
                    style={{
                      padding: "9px 13px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.03)",
                      color: "rgba(255,255,255,0.55)",
                      fontSize: 12,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                placeItems: "center",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "min(58vw, 230px)",
                  aspectRatio: "1",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  border: `1px solid ${member.color}55`,
                  background: illustratedBackground
                    ? isAisha
                      ? "rgba(255,255,255,.68)"
                      : "rgba(20,10,34,.62)"
                    : `radial-gradient(circle at 35% 28%, rgba(255,255,255,0.17), transparent 18%), radial-gradient(circle, ${member.color}24, ${member.color}08 65%, transparent 70%)`,
                  boxShadow: `
                    0 0 0 18px ${member.color}09,
                    0 0 80px ${member.color}20,
                    inset 0 0 45px ${member.color}13
                  `,
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(58px, 9vw, 92px)",
                    fontWeight: 900,
                    color: member.color,
                    textShadow: `0 0 30px ${member.color}66`,
                  }}
                >
                  {member.name.slice(0, 1)}
                </div>

                <div
                  style={{
                    position: "absolute",
                    inset: -14,
                    borderRadius: "50%",
                    border: `1px dashed ${member.color}2e`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {isAmal && (
          <section
            style={{
              marginTop: 26,
              overflow: "hidden",
              borderRadius: 34,
              border: "1px solid rgba(255,196,151,.24)",
              background:
                "linear-gradient(145deg,rgba(61,24,31,.94),rgba(20,9,17,.96))",
              boxShadow: "0 30px 100px rgba(229,153,120,.1)",
            }}
          >
            <div
              style={{ padding: "clamp(26px,5vw,58px)", textAlign: "center" }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#f3c7a8",
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: ".24em",
                }}
              >
                عِشْرُونَ عَامًا مِنَ الْمَوَدَّةِ وَالرَّحْمَةِ
              </p>
              <div
                style={{
                  margin: "18px auto 0",
                  width: 92,
                  height: 92,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  border: "1px solid rgba(255,215,170,.35)",
                  background: "rgba(255,214,168,.08)",
                  color: "#ffe0b7",
                  fontSize: 44,
                  fontWeight: 900,
                }}
              >
                20
              </div>
              <h2
                style={{
                  margin: "20px 0 0",
                  fontSize: "clamp(30px,5vw,58px)",
                  color: "#fff4e9",
                }}
              >
                إلى أمل… شكرًا من القلب
              </h2>
              <p
                style={{
                  margin: "20px auto 0",
                  maxWidth: 850,
                  color: "rgba(255,244,233,.72)",
                  fontSize: "clamp(16px,2vw,20px)",
                  lineHeight: 2.1,
                }}
              >
                عشرون عامًا مضت، وفي كل عام كنتِ أجمل ما فيه. شكرًا لكل حبٍ
                وحنان، لكل صبرٍ وعطاء، ولكل لحظة صنعتِ فيها من البيت وطنًا
                دافئًا ومن الأيام ذكريات لا تُنسى. امتناني لكِ أكبر من الكلمات،
                وأسأل الله أن يديم بيننا المودة والرحمة، وأن تكون أعوامنا
                القادمة أجمل وأهدأ وأسعد. هذه الهدايا العشرون ليست إلا رموزًا
                صغيرة أمام كل ما منحتِنا إياه على مر السنين.
              </p>
              <div
                style={{
                  marginTop: 32,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(105px,1fr))",
                  gap: 12,
                }}
              >
                {Array.from({ length: 20 }, (_, index) => (
                  <div
                    key={index}
                    style={{
                      minHeight: 108,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 22,
                      border: "1px solid rgba(255,218,183,.16)",
                      background:
                        "linear-gradient(145deg,rgba(255,226,197,.11),rgba(255,255,255,.025))",
                      color: "#ffe2c2",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 30 }}>🎁</div>
                      <strong style={{ display: "block", marginTop: 7 }}>
                        الهدية {index + 1}
                      </strong>
                      <small
                        style={{
                          display: "block",
                          marginTop: 4,
                          color: "rgba(255,235,215,.45)",
                        }}
                      >
                        لعامٍ جميل معكِ
                      </small>
                    </div>
                  </div>
                ))}
              </div>
              <p
                style={{
                  margin: "34px 0 0",
                  color: "#f7cda9",
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                كل عام وأنتِ أجمل هدايا العمر 🤍
              </p>
            </div>
          </section>
        )}

        <section
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {sections.map((section) => (
            <button
              key={section.title}
              type="button"
              onClick={() => {
                console.log(`${member.name} - ${section.title}`);
              }}
              style={{
                minHeight: 136,
                padding: 20,
                textAlign: "right",
                borderRadius: 22,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.035)",
                color: "#ffffff",
                cursor: "pointer",
                backdropFilter: "blur(14px)",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.transform = "translateY(-4px)";
                event.currentTarget.style.borderColor = `${member.color}55`;
                event.currentTarget.style.background = `${member.color}0d`;
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = "translateY(0)";
                event.currentTarget.style.borderColor =
                  "rgba(255,255,255,0.08)";
                event.currentTarget.style.background =
                  "rgba(255,255,255,0.035)";
              }}
            >
              <div
                style={{
                  fontSize: 25,
                  color: member.color,
                }}
              >
                {section.icon}
              </div>

              <strong
                style={{
                  display: "block",
                  marginTop: 15,
                  fontSize: 17,
                }}
              >
                {section.title}
              </strong>

              <span
                style={{
                  display: "block",
                  marginTop: 7,
                  color: "rgba(255,255,255,0.38)",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                {section.subtitle}
              </span>
            </button>
          ))}
        </section>

        <section
          style={{
            marginTop: 20,
            padding: "28px 26px",
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.028)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: member.color,
                }}
              >
                LIFE TIMELINE
              </div>

              <h2
                style={{
                  margin: "7px 0 0",
                  fontSize: 28,
                }}
              >
                الخط الزمني
              </h2>
            </div>

            <span
              style={{
                color: "rgba(255,255,255,0.32)",
                fontSize: 12,
              }}
            >
              ينمو تلقائيًا مع الذكريات والأحداث
            </span>
          </div>

          <div
            style={{
              position: "relative",
              marginTop: 28,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 14,
            }}
          >
            {timeline.map((item, index) => (
              <article
                key={item.year}
                style={{
                  position: "relative",
                  padding: 18,
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    color: member.color,
                    background: `${member.color}12`,
                    border: `1px solid ${member.color}40`,
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  {index + 1}
                </div>

                <div
                  style={{
                    marginTop: 14,
                    color: member.color,
                    fontSize: 11,
                  }}
                >
                  {item.year}
                </div>

                <h3
                  style={{
                    margin: "6px 0 0",
                    fontSize: 17,
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    margin: "8px 0 0",
                    color: "rgba(255,255,255,0.36)",
                    fontSize: 12,
                    lineHeight: 1.7,
                  }}
                >
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        button {
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            background 180ms ease,
            opacity 180ms ease;
        }

        button:hover {
          opacity: 1;
        }

        @media (max-width: 760px) {
          section > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
