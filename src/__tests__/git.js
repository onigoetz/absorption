/* global describe, it, expect, jest */

import { Readable } from "stream";
import { jest } from "@jest/globals";

let mockData = ``;

jest.unstable_mockModule("execa", async () => {
  return {
    default: jest.fn().mockImplementation(() => {
      // Randomly split string to make it more realistic to stream
      const items = [];
      let j = 0;
      while (j < mockData.length) {
        let n = Math.floor(Math.random() * 50) + 1;
        if (j + n > mockData.length) {
          n = mockData.length - j;
        }
        items.push(mockData.substr(j, n));
        j += n;
      }

      // Transform to a readable stream
      const stdout = new Readable();
      stdout._read = () => {};
      for (const chunk of items) {
        stdout.push(chunk);
      }
      stdout.push(null);

      return { stdout };
    })
  };
});

const { default: execa } = await import("execa");
const { getBlame } = await import("../git.js");

describe("getBlame", () => {
  it("should Get Blame Data", async () => {
    mockData = `b900ef31329ff95a2894aa5fa528a5dff8dbd9e1 272 272 2
    author Stéphane Goetz
    author-mail <onigoetz@onigoetz.ch>
    author-time 1633874875
    author-tz +0200
    committer Stéphane Goetz
    committer-mail <onigoetz@onigoetz.ch>
    committer-time 1633874875
    committer-tz +0200
    summary Fix SonarQube warnings
    previous ed61d9499adcd859820405779ef884ef9ec82089 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 14 14 1
    author Stéphane Goetz
    author-mail <onigoetz@onigoetz.ch>
    author-time 1633870534
    author-tz +0200
    committer Stéphane Goetz
    committer-mail <onigoetz@onigoetz.ch>
    committer-time 1633870534
    committer-tz +0200
    summary Update dependencies
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 32 32 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 37 37 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 54 54 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 59 59 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 63 63 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 67 67 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 71 71 2
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 89 89 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 93 93 2
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 123 123 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 126 126 2
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 142 142 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 152 152 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 169 169 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 235 235 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 241 241 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 246 246 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 251 251 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 255 255 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 259 259 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 264 264 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    8458e9dc9bf8d9fca50bd264ef0d98274183903c 268 268 1
    previous c3835264ed519571c92f6db99d62d0053c96bb03 src/bin.js
    filename src/bin.js
    35b6e17f8264440e0343a7086158e57d3ebe8001 2 2 8
    author Stéphane Goetz
    author-mail <onigoetz@onigoetz.ch>
    author-time 1621804938
    author-tz +0200
    committer Stéphane Goetz
    committer-mail <onigoetz@onigoetz.ch>
    committer-time 1621804938
    committer-tz +0200
    summary Convert to ESM, use Ava instead of Jest, update dependencies
    previous 76fd10f6d9d093b95b6a89efb1baa2a578b9098f src/bin.js
    filename src/bin.js
    35b6e17f8264440e0343a7086158e57d3ebe8001 13 13 1
    previous 76fd10f6d9d093b95b6a89efb1baa2a578b9098f src/bin.js
    filename src/bin.js
    35b6e17f8264440e0343a7086158e57d3ebe8001 15 15 3
    previous 76fd10f6d9d093b95b6a89efb1baa2a578b9098f src/bin.js
    filename src/bin.js
    35b6e17f8264440e0343a7086158e57d3ebe8001 146 146 1
    previous 76fd10f6d9d093b95b6a89efb1baa2a578b9098f src/bin.js
    filename src/bin.js
    35b6e17f8264440e0343a7086158e57d3ebe8001 154 154 1
    previous 76fd10f6d9d093b95b6a89efb1baa2a578b9098f src/bin.js
    filename src/bin.js
    35b6e17f8264440e0343a7086158e57d3ebe8001 170 170 3
    previous 76fd10f6d9d093b95b6a89efb1baa2a578b9098f src/bin.js
    filename src/bin.js
    35b6e17f8264440e0343a7086158e57d3ebe8001 175 175 1
    previous 76fd10f6d9d093b95b6a89efb1baa2a578b9098f src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 23 23 9
    author Stéphane Goetz
    author-mail <onigoetz@onigoetz.ch>
    author-time 1583962890
    author-tz +0100
    committer Stéphane Goetz
    committer-mail <onigoetz@onigoetz.ch>
    committer-time 1583962890
    committer-tz +0100
    summary Change table style
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 33 33 4
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 38 38 5
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 48 48 6
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 55 55 4
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 61 61 2
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 65 65 2
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 69 69 2
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 73 73 1
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 75 75 14
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 90 90 3
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 95 95 28
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 124 124 2
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 130 130 7
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 206 208 1
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 213 215 1
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 215 217 1
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 222 224 1
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 226 228 1
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    93af1b5958bf959a2e2b288e12ce04dd6ddf6f68 228 230 1
    previous 503659cc9ba82271ccec0243a1f5a3278c092638 src/bin.js
    filename src/bin.js
    ad21a7e328d9b319762802f3f2d3ba37b1214de9 23 43 1
    author Sergio Mendolia
    author-mail <hidden@github.com>
    author-time 1583956478
    author-tz +0100
    committer GitHub
    committer-mail <noreply@github.com>
    committer-time 1583956478
    committer-tz +0100
    summary Allow to customize number of displayed contributors (#6)
    previous bc73883126aa673889539ccbf3ddc6985027dec0 src/bin.js
    filename src/bin.js
    ad21a7e328d9b319762802f3f2d3ba37b1214de9 107 179 2
    previous bc73883126aa673889539ccbf3ddc6985027dec0 src/bin.js
    filename src/bin.js
    ad21a7e328d9b319762802f3f2d3ba37b1214de9 115 187 3
    previous bc73883126aa673889539ccbf3ddc6985027dec0 src/bin.js
    filename src/bin.js
    ad21a7e328d9b319762802f3f2d3ba37b1214de9 139 210 1
    previous bc73883126aa673889539ccbf3ddc6985027dec0 src/bin.js
    filename src/bin.js
    ad21a7e328d9b319762802f3f2d3ba37b1214de9 197 243 3
    previous bc73883126aa673889539ccbf3ddc6985027dec0 src/bin.js
    filename src/bin.js
    ad21a7e328d9b319762802f3f2d3ba37b1214de9 201 247 4
    previous bc73883126aa673889539ccbf3ddc6985027dec0 src/bin.js
    filename src/bin.js
    ad21a7e328d9b319762802f3f2d3ba37b1214de9 206 252 1
    previous bc73883126aa673889539ccbf3ddc6985027dec0 src/bin.js
    filename src/bin.js
    83ab47ad2b7776fa954f7c0d94d47239425537eb 86 156 1
    author Stéphane Goetz
    author-mail <onigoetz@onigoetz.ch>
    author-time 1583876934
    author-tz +0100
    committer Stéphane Goetz
    committer-mail <onigoetz@onigoetz.ch>
    committer-time 1583876934
    committer-tz +0100
    summary Exclude lockfiles by default
    previous c987c99ae7c125b84d36c80cc57d1c1ce3ef828b src/bin.js
    filename src/bin.js
    83ab47ad2b7776fa954f7c0d94d47239425537eb 88 158 1
    previous c987c99ae7c125b84d36c80cc57d1c1ce3ef828b src/bin.js
    filename src/bin.js
    83ab47ad2b7776fa954f7c0d94d47239425537eb 105 177 1
    previous c987c99ae7c125b84d36c80cc57d1c1ce3ef828b src/bin.js
    filename src/bin.js
    83ab47ad2b7776fa954f7c0d94d47239425537eb 110 184 1
    previous c987c99ae7c125b84d36c80cc57d1c1ce3ef828b src/bin.js
    filename src/bin.js
    c987c99ae7c125b84d36c80cc57d1c1ce3ef828b 104 178 1
    author Stéphane Goetz
    author-mail <onigoetz@onigoetz.ch>
    author-time 1583876912
    author-tz +0100
    committer Stéphane Goetz
    committer-mail <onigoetz@onigoetz.ch>
    committer-time 1583876912
    committer-tz +0100
    summary Display biggest files
    previous 8f1152997505436203200206a7fb630ec67c850e src/bin.js
    filename src/bin.js
    c987c99ae7c125b84d36c80cc57d1c1ce3ef828b 115 193 4
    previous 8f1152997505436203200206a7fb630ec67c850e src/bin.js
    filename src/bin.js
    c987c99ae7c125b84d36c80cc57d1c1ce3ef828b 150 223 1
    previous 8f1152997505436203200206a7fb630ec67c850e src/bin.js
    filename src/bin.js
    c987c99ae7c125b84d36c80cc57d1c1ce3ef828b 154 225 3
    previous 8f1152997505436203200206a7fb630ec67c850e src/bin.js
    filename src/bin.js
    c987c99ae7c125b84d36c80cc57d1c1ce3ef828b 157 229 1
    previous 8f1152997505436203200206a7fb630ec67c850e src/bin.js
    filename src/bin.js
    8f1152997505436203200206a7fb630ec67c850e 17 19 1
    author Stéphane Goetz
    author-mail <onigoetz@onigoetz.ch>
    author-time 1583873999
    author-tz +0100
    committer Stéphane Goetz
    committer-mail <onigoetz@onigoetz.ch>
    committer-time 1583875417
    committer-tz +0100
    summary Fix linting issue
    previous 5457e392981a5e07ac46db5bd4d64f29f695a99c src/bin.js
    filename src/bin.js
    8f1152997505436203200206a7fb630ec67c850e 67 139 3
    previous 5457e392981a5e07ac46db5bd4d64f29f695a99c src/bin.js
    filename src/bin.js
    8f1152997505436203200206a7fb630ec67c850e 71 143 3
    previous 5457e392981a5e07ac46db5bd4d64f29f695a99c src/bin.js
    filename src/bin.js
    8f1152997505436203200206a7fb630ec67c850e 79 151 1
    previous 5457e392981a5e07ac46db5bd4d64f29f695a99c src/bin.js
    filename src/bin.js
    8f1152997505436203200206a7fb630ec67c850e 95 168 1
    previous 5457e392981a5e07ac46db5bd4d64f29f695a99c src/bin.js
    filename src/bin.js
    8f1152997505436203200206a7fb630ec67c850e 118 203 1
    previous 5457e392981a5e07ac46db5bd4d64f29f695a99c src/bin.js
    filename src/bin.js
    5457e392981a5e07ac46db5bd4d64f29f695a99c 22 44 4
    author Stéphane Goetz
    author-mail <onigoetz@onigoetz.ch>
    author-time 1583873899
    author-tz +0100
    committer Stéphane Goetz
    committer-mail <onigoetz@onigoetz.ch>
    committer-time 1583873899
    committer-tz +0100
    summary Improve output formatting
    previous 1ca1946dc1cdefb1d7602e3d54085daa7c949016 src/bin.js
    filename src/bin.js
    5457e392981a5e07ac46db5bd4d64f29f695a99c 32 60 1
    previous 1ca1946dc1cdefb1d7602e3d54085daa7c949016 src/bin.js
    filename src/bin.js
    5457e392981a5e07ac46db5bd4d64f29f695a99c 39 64 1
    previous 1ca1946dc1cdefb1d7602e3d54085daa7c949016 src/bin.js
    filename src/bin.js
    5457e392981a5e07ac46db5bd4d64f29f695a99c 46 68 1
    previous 1ca1946dc1cdefb1d7602e3d54085daa7c949016 src/bin.js
    filename src/bin.js
    5457e392981a5e07ac46db5bd4d64f29f695a99c 55 74 1
    previous 1ca1946dc1cdefb1d7602e3d54085daa7c949016 src/bin.js
    filename src/bin.js
    5457e392981a5e07ac46db5bd4d64f29f695a99c 60 128 2
    previous 1ca1946dc1cdefb1d7602e3d54085daa7c949016 src/bin.js
    filename src/bin.js
    5457e392981a5e07ac46db5bd4d64f29f695a99c 65 137 2
    previous 1ca1946dc1cdefb1d7602e3d54085daa7c949016 src/bin.js
    filename src/bin.js
    5457e392981a5e07ac46db5bd4d64f29f695a99c 128 207 1
    previous 1ca1946dc1cdefb1d7602e3d54085daa7c949016 src/bin.js
    filename src/bin.js
    5457e392981a5e07ac46db5bd4d64f29f695a99c 129 209 1
    previous 1ca1946dc1cdefb1d7602e3d54085daa7c949016 src/bin.js
    filename src/bin.js
    5457e392981a5e07ac46db5bd4d64f29f695a99c 131 211 4
    previous 1ca1946dc1cdefb1d7602e3d54085daa7c949016 src/bin.js
    filename src/bin.js
    5457e392981a5e07ac46db5bd4d64f29f695a99c 138 216 1
    previous 1ca1946dc1cdefb1d7602e3d54085daa7c949016 src/bin.js
    filename src/bin.js
    5457e392981a5e07ac46db5bd4d64f29f695a99c 143 218 5
    previous 1ca1946dc1cdefb1d7602e3d54085daa7c949016 src/bin.js
    filename src/bin.js
    1ca1946dc1cdefb1d7602e3d54085daa7c949016 75 205 1
    author Stéphane Goetz
    author-mail <onigoetz@onigoetz.ch>
    author-time 1583871937
    author-tz +0100
    committer Stéphane Goetz
    committer-mail <onigoetz@onigoetz.ch>
    committer-time 1583871937
    committer-tz +0100
    summary Replace active/passive with fresh/fading
    previous 9e91bdd8ed6b6202fc6a87232178b833c616499d src/bin.js
    filename src/bin.js
    2ae354d3fe4f43f4a471868e5e1ead6c20b421d9 33 155 1
    author Stéphane Goetz
    author-mail <onigoetz@onigoetz.ch>
    author-time 1583789432
    author-tz +0100
    committer Stéphane Goetz
    committer-mail <onigoetz@onigoetz.ch>
    committer-time 1583789432
    committer-tz +0100
    summary Add --with-media and exclude media files by default
    previous 9ba5d9056811e8d79447cecaba51781f06efb3e9 src/bin.js
    filename src/bin.js
    2ae354d3fe4f43f4a471868e5e1ead6c20b421d9 34 157 1
    previous 9ba5d9056811e8d79447cecaba51781f06efb3e9 src/bin.js
    filename src/bin.js
    2ae354d3fe4f43f4a471868e5e1ead6c20b421d9 54 174 1
    previous 9ba5d9056811e8d79447cecaba51781f06efb3e9 src/bin.js
    filename src/bin.js
    2ae354d3fe4f43f4a471868e5e1ead6c20b421d9 56 176 1
    previous 9ba5d9056811e8d79447cecaba51781f06efb3e9 src/bin.js
    filename src/bin.js
    2ae354d3fe4f43f4a471868e5e1ead6c20b421d9 120 261 3
    previous 9ba5d9056811e8d79447cecaba51781f06efb3e9 src/bin.js
    filename src/bin.js
    2ae354d3fe4f43f4a471868e5e1ead6c20b421d9 124 265 1
    previous 9ba5d9056811e8d79447cecaba51781f06efb3e9 src/bin.js
    filename src/bin.js
    e8b56f44a003ce78b3c4229f6588c982fd7f1ce5 7 10 3
    author Stéphane Goetz
    author-mail <onigoetz@onigoetz.ch>
    author-time 1583703128
    author-tz +0100
    committer Stéphane Goetz
    committer-mail <onigoetz@onigoetz.ch>
    committer-time 1583703229
    committer-tz +0100
    summary Add some tests, add weights
    previous d967854bff7de44fff32bf2d20453fc843e91413 src/bin.js
    filename src/bin.js
    e8b56f44a003ce78b3c4229f6588c982fd7f1ce5 21 148 3
    previous d967854bff7de44fff32bf2d20453fc843e91413 src/bin.js
    filename src/bin.js
    e8b56f44a003ce78b3c4229f6588c982fd7f1ce5 32 153 1
    previous d967854bff7de44fff32bf2d20453fc843e91413 src/bin.js
    filename src/bin.js
    e8b56f44a003ce78b3c4229f6588c982fd7f1ce5 34 159 6
    previous d967854bff7de44fff32bf2d20453fc843e91413 src/bin.js
    filename src/bin.js
    e8b56f44a003ce78b3c4229f6588c982fd7f1ce5 42 167 1
    previous d967854bff7de44fff32bf2d20453fc843e91413 src/bin.js
    filename src/bin.js
    e8b56f44a003ce78b3c4229f6588c982fd7f1ce5 53 173 1
    previous d967854bff7de44fff32bf2d20453fc843e91413 src/bin.js
    filename src/bin.js
    e8b56f44a003ce78b3c4229f6588c982fd7f1ce5 54 181 3
    previous d967854bff7de44fff32bf2d20453fc843e91413 src/bin.js
    filename src/bin.js
    e8b56f44a003ce78b3c4229f6588c982fd7f1ce5 58 185 2
    previous d967854bff7de44fff32bf2d20453fc843e91413 src/bin.js
    filename src/bin.js
    e8b56f44a003ce78b3c4229f6588c982fd7f1ce5 61 190 3
    previous d967854bff7de44fff32bf2d20453fc843e91413 src/bin.js
    filename src/bin.js
    e8b56f44a003ce78b3c4229f6588c982fd7f1ce5 64 197 6
    previous d967854bff7de44fff32bf2d20453fc843e91413 src/bin.js
    filename src/bin.js
    e8b56f44a003ce78b3c4229f6588c982fd7f1ce5 71 204 1
    previous d967854bff7de44fff32bf2d20453fc843e91413 src/bin.js
    filename src/bin.js
    e8b56f44a003ce78b3c4229f6588c982fd7f1ce5 73 206 1
    previous d967854bff7de44fff32bf2d20453fc843e91413 src/bin.js
    filename src/bin.js
    e8b56f44a003ce78b3c4229f6588c982fd7f1ce5 113 257 2
    previous d967854bff7de44fff32bf2d20453fc843e91413 src/bin.js
    filename src/bin.js
    e8b56f44a003ce78b3c4229f6588c982fd7f1ce5 116 260 1
    previous d967854bff7de44fff32bf2d20453fc843e91413 src/bin.js
    filename src/bin.js
    341b5b57b5944aefec867162a7e9c14a1e6b008f 1 1 1
    author Stéphane Goetz
    author-mail <onigoetz@onigoetz.ch>
    author-time 1583662664
    author-tz +0100
    committer Stéphane Goetz
    committer-mail <onigoetz@onigoetz.ch>
    committer-time 1583662664
    committer-tz +0100
    summary initial commit
    boundary
    filename src/bin.js
    341b5b57b5944aefec867162a7e9c14a1e6b008f 7 18 1
    filename src/bin.js
    341b5b57b5944aefec867162a7e9c14a1e6b008f 9 20 3
    filename src/bin.js
    341b5b57b5944aefec867162a7e9c14a1e6b008f 13 147 1
    filename src/bin.js
    341b5b57b5944aefec867162a7e9c14a1e6b008f 14 165 2
    filename src/bin.js
    341b5b57b5944aefec867162a7e9c14a1e6b008f 22 231 4
    filename src/bin.js
    341b5b57b5944aefec867162a7e9c14a1e6b008f 27 236 5
    filename src/bin.js
    341b5b57b5944aefec867162a7e9c14a1e6b008f 33 242 1
    filename src/bin.js
    341b5b57b5944aefec867162a7e9c14a1e6b008f 34 253 2
    filename src/bin.js
    341b5b57b5944aefec867162a7e9c14a1e6b008f 37 256 1
    filename src/bin.js
    341b5b57b5944aefec867162a7e9c14a1e6b008f 38 266 2
    filename src/bin.js
    341b5b57b5944aefec867162a7e9c14a1e6b008f 41 269 3
    filename src/bin.js`.replace(/\n\s+/g, "\n");

    const blame = await getBlame("dir", "somefile.js");

    expect(blame).toMatchInlineSnapshot(`
      Object {
        "1583017200000": Object {
          "Sergio Mendolia <hidden@github.com>": 15,
          "Stéphane Goetz <onigoetz@onigoetz.ch>": 212,
        },
        "1619820000000": Object {
          "Stéphane Goetz <onigoetz@onigoetz.ch>": 18,
        },
        "1633039200000": Object {
          "Stéphane Goetz <onigoetz@onigoetz.ch>": 28,
        },
      }
    `);
    expect(execa).toHaveBeenCalledWith(
      "git",
      ["blame", "--incremental", "somefile.js", "master"],
      { cwd: "dir" }
    );
  });
});
