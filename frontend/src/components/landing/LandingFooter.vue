<template>
  <footer class="landing-footer">
    <div class="container">
      <div class="footer-top row q-col-gutter-xl">
        <!-- Brand Column -->
        <div class="col-12 col-md-4 brand-column">
          <div class="brand" @click="scrollToTop">
            <div class="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="7" fill="#8B6FD8" />
                <path
                  d="M7 12.5L10.5 16L17 8.5"
                  stroke="white"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <span class="brand-name">TaskFlow</span>
          </div>

          <p class="brand-tagline">
            A modern project management solution for teams that want to get things done.
          </p>

          <!-- Social Icons -->
          <div class="social-icons row items-center q-gutter-x-sm">
            <a href="javascript:void(0)" class="social-link" aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                />
              </svg>
            </a>
            <a href="javascript:void(0)" class="social-link" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.55c-.93 0-1.68.75-1.68 1.68s.75 1.68 1.68 1.68 1.68-.75 1.68-1.68-.75-1.68-1.68-1.68z"
                />
              </svg>
            </a>
            <a href="javascript:void(0)" class="social-link" aria-label="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </a>
          </div>
        </div>

        <!-- Links Columns -->
        <div class="col-12 col-md-8 links-columns">
          <div class="row q-col-gutter-lg">
            <!-- Product -->
            <div class="col-6 col-sm-3">
              <h4 class="column-heading">Product</h4>
              <ul class="footer-links">
                <li><a href="#features" @click.prevent="scrollTo('features')">Features</a></li>
                <li>
                  <a href="#how-it-works" @click.prevent="scrollTo('how-it-works')">How it Works</a>
                </li>
                <li><a href="#pricing" @click.prevent="scrollTo('pricing')">Pricing</a></li>
                <li><a href="javascript:void(0)">Updates</a></li>
              </ul>
            </div>

            <!-- Company -->
            <div class="col-6 col-sm-3">
              <h4 class="column-heading">Company</h4>
              <ul class="footer-links">
                <li><a href="javascript:void(0)">About Us</a></li>
                <li><a href="javascript:void(0)">Careers</a></li>
                <li><a href="javascript:void(0)">Blog</a></li>
                <li><a href="javascript:void(0)">Contact</a></li>
              </ul>
            </div>

            <!-- Resources -->
            <div class="col-6 col-sm-3">
              <h4 class="column-heading">Resources</h4>
              <ul class="footer-links">
                <li><a href="javascript:void(0)">Help Center</a></li>
                <li><a href="javascript:void(0)">Guides</a></li>
                <li><a href="javascript:void(0)">API Docs</a></li>
                <li><a href="javascript:void(0)">Community</a></li>
              </ul>
            </div>

            <!-- Legal -->
            <div class="col-6 col-sm-3">
              <h4 class="column-heading">Legal</h4>
              <ul class="footer-links">
                <li><a href="javascript:void(0)">Privacy Policy</a></li>
                <li><a href="javascript:void(0)">Terms of Service</a></li>
                <li><a href="javascript:void(0)">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <q-separator class="q-my-xl" />

      <!-- Footer Bottom -->
      <div class="footer-bottom text-center">
        <p class="copyright-text">© 2026 TaskFlow. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollTo(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}
</script>

<style scoped lang="scss">
.landing-footer {
  background: #ffffff;
  border-top: 1px solid #f0f2f5;
  padding: 72px 0 40px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin-bottom: 14px;
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-name {
  font-size: 19px;
  font-weight: 700;
  color: #181d28;
  letter-spacing: -0.02em;
}

.brand-tagline {
  font-size: 14px;
  line-height: 1.6;
  color: #64748b;
  margin: 0 0 20px 0;
  max-width: 300px;
}

.social-icons {
  display: flex;
  gap: 12px;
}

.social-link {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: #f4f0fd;
    color: #8b6fd8;
    border-color: #d8b4fe;
  }
}

.column-heading {
  font-size: 14px;
  font-weight: 700;
  color: #181d28;
  letter-spacing: -0.01em;
  margin: 0 0 16px 0;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;

  li a {
    color: #64748b;
    font-size: 14px;
    text-decoration: none;
    transition: color 0.15s ease;

    &:hover {
      color: #8b6fd8;
    }
  }
}

.copyright-text {
  font-size: 13.5px;
  color: #94a3b8;
  margin: 0;
}
</style>
