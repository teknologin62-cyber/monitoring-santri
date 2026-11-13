
import PrimaryButton from "./components/PrimaryButton";
import InputField from "./components/InputField";
import "./App.css";

function App() {
  return (
    <main className="design-page">

      <section className="design-header">
        <p className="eyebrow">DESIGN SYSTEM</p>

        <h1>Monitoring Santri</h1>

        <p>
          Pantau - Bimbing - Raih Prestasi
        </p>
      </section>

      <section className="design-card">

        <h2>Color Palette</h2>

        <div className="color-list">
          <div className="color-item">
            <div className="color-box primary"></div>
            <span>Primary Green</span>
          </div>

          <div className="color-item">
            <div className="color-box mint"></div>
            <span>Mint Green</span>
          </div>

          <div className="color-item">
            <div className="color-box white"></div>
            <span>White</span>
          </div>
        </div>

        <h2>Typography</h2>

        <h1 className="sample-heading">
          Selamat Datang
        </h1>

        <p className="sample-text">
          Bersama kita wujudkan proses pembinaan
          santri yang lebih mudah, terukur dan bermakna.
        </p>

        <h2>Input Components</h2>

        <InputField
          label="Nama Lengkap"
          placeholder="Masukkan nama lengkap"
        />

        <InputField
          label="Email atau No. HP"
          placeholder="Masukkan email atau nomor HP"
        />

        <h2>Button Components</h2>

        <PrimaryButton>
          Contoh Tombol
        </PrimaryButton>

      </section>

    </main>
  );
}

export default App;
